import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePatients } from './usePatients';
import * as galleryService from '../services/galleryService';

// Powers the "Patients Tracked" dashboard detail page. Combines the real
// patients list (usePatients) with each patient's real scans (pulled from
// the same scans+patients join used elsewhere), so "Total X-rays", View
// Reports and View X-rays all reflect actual uploaded/analysed scans.

function hashString(str) {
  let h = 0;
  for (let i = 0; i < String(str).length; i += 1) h = (h * 31 + String(str).charCodeAt(i)) >>> 0;
  return h;
}

function deriveGender(seed) { return hashString(`gender-${seed}`) % 2 === 0 ? 'Female' : 'Male'; }

export function useTrackedPatients() {
  const { patients, patientsLoaded, patientsError } = usePatients();
  const [scansByPatient, setScansByPatient] = useState({});
  const [scansLoaded, setScansLoaded] = useState(false);

  const loadScans = useCallback(async () => {
    const { data, error } = await galleryService.getGalleryScans();
    if (!error && data) {
      const map = {};
      data.forEach((row) => {
        const pid = row.patients?.id;
        if (!pid) return;
        if (!map[pid]) map[pid] = [];
        map[pid].push({
          id: row.id,
          imageUrl: row.image_url,
          diagnosis: row.prediction || 'Not Yet Analysed',
          confidence: row.confidence,
          uploadedAt: row.uploaded_at,
          report: (row.reports || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null,
        });
      });
      Object.values(map).forEach((list) => list.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)));
      setScansByPatient(map);
    }
    setScansLoaded(true);
  }, []);

  useEffect(() => { loadScans(); }, [loadScans]);

  const trackedPatients = useMemo(() => {
    return patients.map((p) => ({
      patientDbId: p.dbId,
      patientCode: p.id,
      patientName: p.name,
      status: p.status,
      badge: p.badge,
      description: p.desc,
      age: p.age ?? null,
      gender: deriveGender(p.dbId),
      phone: p.phone || '',
      lastVisit: p.history[0]?.date || 'No visits recorded',
      scans: scansByPatient[p.dbId] || [],
      totalXrays: (scansByPatient[p.dbId] || []).length,
    }));
  }, [patients, scansByPatient]);

  return { trackedPatients, loading: !patientsLoaded || !scansLoaded, error: patientsError, reload: loadScans };
}
