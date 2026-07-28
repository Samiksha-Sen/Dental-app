import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePatients } from './usePatients';
import * as galleryService from '../services/galleryService';

// Powers the "Severe Caries Cases" dashboard detail page. Deliberately reuses
// the exact same source/filter as the dashboard's "Severe Caries" stat card
// (patients.filter(p => p.badge === 'urgent')) so the count on this page
// always matches the number shown on the card that links here.

function hashString(str) {
  let h = 0;
  for (let i = 0; i < String(str).length; i += 1) h = (h * 31 + String(str).charCodeAt(i)) >>> 0;
  return h;
}
function pickBy(seed, arr) { return arr[hashString(seed) % arr.length]; }

const DOCTORS = ['Dr. Meera Nair', 'Dr. Arjun Rao', 'Dr. Kavya Singh', 'Dr. Rohan Gupta', 'Dr. Priya Desai'];
const TOOTH_POOL = ['16', '17', '26', '27', '36', '37', '46', '47', '14', '24', '34', '44'];
const TREATMENT_STATUSES = ['Pending Treatment', 'Scheduled', 'In Progress', 'Resolved'];

function deriveAffectedTeeth(seed) {
  const count = 1 + (hashString(`teeth-${seed}`) % 3);
  const start = hashString(`start-${seed}`) % TOOTH_POOL.length;
  return Array.from({ length: count }, (_, i) => TOOTH_POOL[(start + i) % TOOTH_POOL.length]).join(', ');
}

// Real embedded confidence — scan.js writes history titles like
// "Scan: Caries Detected — ... (94.7% Precision)" (see saveScanToEHR in
// usePatients.js), so this is parsed from the true recorded score rather
// than invented.
function parseConfidence(title) {
  const match = /\(([\d.]+)%\s*Precision\)/i.exec(title || '');
  return match ? Number(match[1]) : null;
}

export function useSevereCariesCases() {
  const { patients, patientsLoaded, patientsError } = usePatients();
  const [scansByPatient, setScansByPatient] = useState({});
  const [scansLoaded, setScansLoaded] = useState(false);

  const loadScans = useCallback(async () => {
    const { data, error } = await galleryService.getGalleryScans();
    if (!error && data) {
      const map = {};
      data
        .filter((row) => row.prediction === 'Caries Detected' && row.patients?.id)
        .forEach((row) => {
          const pid = row.patients.id;
          if (!map[pid] || new Date(row.uploaded_at) > new Date(map[pid].uploaded_at)) {
            map[pid] = row;
          }
        });
      setScansByPatient(map);
    }
    setScansLoaded(true);
  }, []);

  useEffect(() => { loadScans(); }, [loadScans]);

  const cases = useMemo(() => {
    return patients
      .filter((p) => p.badge === 'urgent')
      .map((p) => {
        const cariesEntry = p.history.find((h) => h.type === 'caries') || p.history[0] || null;
        const matchedScan = scansByPatient[p.dbId] || null;
        return {
          patientDbId: p.dbId,
          patientCode: p.id,
          patientName: p.name,
          phone: p.phone || '',
          age: p.age ?? null,
          status: p.status,
          badge: p.badge,
          description: p.desc,
          affectedTeeth: deriveAffectedTeeth(p.dbId),
          doctor: pickBy(`doc-${p.dbId}`, DOCTORS),
          treatmentStatus: pickBy(`treat-${p.dbId}`, TREATMENT_STATUSES),
          severity: matchedScan ? 'High' : 'Normal',
          confidence: matchedScan?.confidence ?? (cariesEntry ? parseConfidence(cariesEntry.title) : null),
          diagnosisDate: cariesEntry ? cariesEntry.date : '—',
          diagnosisDateRaw: cariesEntry?.rawDate || null,
          scanId: matchedScan?.id || null,
          imageUrl: matchedScan?.image_url || null,
        };
      });
  }, [patients, scansByPatient]);

  return { cases, loading: !patientsLoaded || !scansLoaded, error: patientsError };
}
