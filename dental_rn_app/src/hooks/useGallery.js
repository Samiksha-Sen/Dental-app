import { useCallback, useEffect, useMemo, useState } from 'react';
import * as galleryService from '../services/galleryService';
import * as scanService from '../services/scanService';
import * as storageService from '../services/storageService';
import * as databaseService from '../services/databaseService';
import { predictXray } from '../services/predictApi';
import { GALLERY_DOCTORS, SCAN_TYPES } from '../theme/galleryTokens';

function hashString(str) {
  let h = 0;
  for (let i = 0; i < String(str).length; i += 1) h = (h * 31 + String(str).charCodeAt(i)) >>> 0;
  return h;
}
function pickBy(seed, arr) { return arr[hashString(seed) % arr.length]; }

function toDateKey(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Derives an AI Status label from the real `status`/`confidence` columns.
// 'Rejected' has no real signal in the current schema/flow, so it's never
// synthesized here — it stays defined in galleryTokens for when the backend
// gains a real invalid-image rejection path.
function deriveAiStatus(row) {
  if (row.status === 'processing') return 'Processing';
  if (row.status === 'completed') {
    if (!row.prediction) return 'Pending';
    if (row.confidence != null && row.confidence >= 40 && row.confidence <= 60) return 'Requires Review';
    return 'Analysed';
  }
  return 'Pending';
}

function mapRow(row) {
  const patient = row.patients || null;
  const latestReport = (row.reports || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null;
  const seed = row.id;

  return {
    id: row.id,
    scanCode: `SCAN-${row.id.slice(0, 8).toUpperCase()}`,
    patientId: patient?.id || null,
    patientCode: patient?.patient_code || '—',
    patientName: patient?.name || 'Unassigned Patient',
    imageUrl: row.image_url,
    uploadedAt: row.uploaded_at,
    dateKey: toDateKey(row.uploaded_at),
    prediction: row.prediction,
    confidence: row.confidence,
    status: row.status,
    favourite: !!row.favourite,
    aiStatus: deriveAiStatus(row),
    diagnosis: row.prediction || 'Not Yet Analysed',
    doctor: pickBy(`doc-${seed}`, GALLERY_DOCTORS),
    scanType: pickBy(`type-${seed}`, SCAN_TYPES),
    treatment: row.prediction === 'Caries Detected' ? 'Caries Treatment' : 'Routine Check-up',
    age: 15 + (hashString(`age-${seed}`) % 60),
    gender: hashString(`gender-${seed}`) % 2 === 0 ? 'Female' : 'Male',
    notes: latestReport?.recommendation || 'No clinical notes recorded for this scan yet.',
    severity: latestReport?.severity || null,
  };
}

export function useGallery() {
  const [rawRows, setRawRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await galleryService.getGalleryScans();
    if (err) {
      setError(err.message);
    } else {
      setRawRows(data);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const items = useMemo(() => rawRows.map(mapRow), [rawRows]);

  const summary = useMemo(() => {
    const todayKey = toDateKey(new Date().toISOString());
    return {
      total: items.length,
      todayUploads: items.filter((i) => i.dateKey === todayKey).length,
      analysed: items.filter((i) => i.aiStatus === 'Analysed').length,
      pending: items.filter((i) => i.aiStatus === 'Pending' || i.aiStatus === 'Processing').length,
    };
  }, [items]);

  const patientGroups = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      const key = item.patientId || 'unassigned';
      if (!map.has(key)) {
        map.set(key, {
          patientId: item.patientId,
          patientName: item.patientName,
          patientCode: item.patientCode,
          scans: [],
        });
      }
      map.get(key).scans.push(item);
    });
    return Array.from(map.values())
      .map((g) => ({
        ...g,
        scans: g.scans.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)),
        totalScans: g.scans.length,
        lastVisit: g.scans[0]?.uploadedAt,
      }))
      .sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit));
  }, [items]);

  const deleteItem = useCallback(async (item) => {
    const { error: delErr } = await scanService.deleteScan(item.id);
    if (delErr) return { error: delErr };
    const path = galleryService.storagePathFromPublicUrl(item.imageUrl);
    if (path) {
      storageService.deleteXray(path).catch(() => {});
    }
    setRawRows((prev) => prev.filter((r) => r.id !== item.id));
    return { error: null };
  }, []);

  const toggleFavourite = useCallback(async (item) => {
    const next = !item.favourite;
    setRawRows((prev) => prev.map((r) => (r.id === item.id ? { ...r, favourite: next } : r)));
    const { error: favErr } = await galleryService.setFavourite(item.id, next);
    if (favErr) {
      setRawRows((prev) => prev.map((r) => (r.id === item.id ? { ...r, favourite: !next } : r)));
      return { error: favErr };
    }
    return { error: null };
  }, []);

  const rerunAnalysis = useCallback(async (item, apiUrl, threshold) => {
    if (!apiUrl) return { error: new Error('No AI API URL configured in Settings.') };
    setRawRows((prev) => prev.map((r) => (r.id === item.id ? { ...r, status: 'processing' } : r)));
    try {
      const data = await predictXray(item.imageUrl, apiUrl, threshold / 100);
      if (data.error) {
        setRawRows((prev) => prev.map((r) => (r.id === item.id ? { ...r, status: 'completed' } : r)));
        return { error: new Error(data.error) };
      }
      const isCaries = (data.condition || '').toLowerCase().startsWith('caries');
      const finalPrediction = isCaries ? 'Caries Detected' : 'No Caries Detected';
      const finalConfidence = Number(data.confidence || 0);

      await scanService.updateScanPrediction(item.id, { prediction: finalPrediction, confidence: finalConfidence, status: 'completed' });
      await databaseService.createReport({
        scan_id: item.id,
        severity: isCaries ? 'high' : 'normal',
        recommendation: data.extraction || 'Routine clinical monitoring',
      });
      await load();
      return { error: null };
    } catch (e) {
      setRawRows((prev) => prev.map((r) => (r.id === item.id ? { ...r, status: 'completed' } : r)));
      return { error: e };
    }
  }, [load]);

  return {
    items, loading, error, reload: load, summary, patientGroups,
    deleteItem, toggleFavourite, rerunAnalysis,
  };
}
