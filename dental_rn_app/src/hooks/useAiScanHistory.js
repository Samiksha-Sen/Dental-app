import { useCallback, useEffect, useMemo, useState } from 'react';
import * as galleryService from '../services/galleryService';

// Powers the "AI Scan History" dashboard detail page. Reuses
// galleryService.getGalleryScans() — the same real scans+patients join the
// (now-removed) Gallery module used — instead of duplicating a new query,
// since it already returns exactly the patient-joined scan rows this page needs.

function toDateKey(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function toTimeLabel(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
function titleCase(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function mapRow(row) {
  const patient = row.patients || null;
  return {
    id: row.id,
    patientId: patient?.id || null,
    patientName: patient?.name || 'Unassigned Patient',
    patientCode: patient?.patient_code || '—',
    patientPhone: patient?.phone || '',
    patientAge: patient?.age ?? null,
    imageUrl: row.image_url,
    uploadedAt: row.uploaded_at,
    dateKey: toDateKey(row.uploaded_at),
    timeLabel: toTimeLabel(row.uploaded_at),
    diagnosis: row.prediction || 'Not Yet Analysed',
    confidence: row.confidence,
    status: titleCase(row.status),
  };
}

export function useAiScanHistory() {
  const [rawRows, setRawRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await galleryService.getGalleryScans();
    if (err) setError(err.message);
    else { setRawRows(data); setError(null); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const scans = useMemo(() => rawRows.map(mapRow), [rawRows]);

  return { scans, loading, error, reload: load };
}
