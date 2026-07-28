import { useCallback, useEffect, useState } from 'react';
import * as databaseService from '../services/databaseService';

// Formats a Postgres timestamptz the same way the old hardcoded demo data read
const formatHistoryDate = (isoString) => {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    `, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
};

export function usePatients() {
  const [patients, setPatients] = useState([]);
  const [patientsLoaded, setPatientsLoaded] = useState(false);
  const [patientsError, setPatientsError] = useState(null);

  const loadPatients = useCallback(async () => {
    const { data, error } = await databaseService.getPatients();

    if (error) {
      console.error('Failed to load patients from Supabase', error);
      setPatientsError(error.message);
      setPatientsLoaded(true);
      return;
    }

    const mapped = (data || []).map(p => ({
      dbId: p.id,
      id: p.patient_code,
      name: p.name,
      phone: p.phone || '',
      age: p.age ?? null,
      status: p.status,
      badge: p.badge,
      desc: p.description,
      history: [...(p.patient_history || [])]
        .sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
        .map(h => ({ date: formatHistoryDate(h.event_date), rawDate: h.event_date, title: h.title, type: h.type, imageUrl: h.image_url }))
    }));

    setPatients(mapped);
    setPatientsError(null);
    setPatientsLoaded(true);
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const createPatient = useCallback(async ({ name, phone, age, allergies, status }) => {
    if (!name.trim()) {
      return { error: new Error('Please enter patient name.') };
    }
    if (!/^\d{10}$/.test(phone || '')) {
      return { error: new Error('Please enter a valid 10-digit mobile number.') };
    }
    const ageNum = Number(age);
    if (!age || Number.isNaN(ageNum) || ageNum <= 0 || ageNum > 119) {
      return { error: new Error('Please enter a valid age.') };
    }

    const { data: patientId, error: idError } = await databaseService.getNextPatientCode();
    if (idError) {
      return { error: idError };
    }
    const badgeType = status === 'Urgent Care' ? 'urgent' : status === 'Pending' ? 'pending' : 'cleared';
    const description = `Allergies: ${allergies.trim() || 'None'}. New patient profile registered.`;

    const { data: insertedPatient, error: insertError } = await databaseService.createPatient({
      patient_code: patientId,
      name: name.trim(),
      phone,
      age: ageNum,
      status,
      badge: badgeType,
      description,
    });

    if (insertError) {
      console.error('Failed to register patient in Supabase', insertError);
      return { error: insertError };
    }

    const { data: historyRow, error: historyError } = await databaseService.addPatientHistory({
      patient_id: insertedPatient.id,
      title: 'Initial Registration & EHR Profile Created',
      type: 'regular',
    });

    if (historyError) {
      console.error('Failed to record initial history entry in Supabase', historyError);
    }

    const newPatientObj = {
      dbId: insertedPatient.id,
      id: insertedPatient.patient_code,
      name: insertedPatient.name,
      phone: insertedPatient.phone || '',
      age: insertedPatient.age ?? null,
      status: insertedPatient.status,
      badge: insertedPatient.badge,
      desc: insertedPatient.description,
      history: historyRow
        ? [{ date: formatHistoryDate(historyRow.event_date), title: historyRow.title, type: historyRow.type }]
        : []
    };

    setPatients(prev => [newPatientObj, ...prev]);

    return { data: newPatientObj, error: null };
  }, []);

  const saveScanToEHR = useCallback(async ({ patientName, predictionCondition, predictionExtraction, predictionConfidence, scanId, imageUrl }) => {
    if (!predictionCondition) return { error: new Error('No prediction to save.') };

    const target = patients.find(p => p.name === patientName);
    if (!target) return { error: new Error('Patient not found.') };

    const isCaries = predictionCondition === 'Caries Detected';
    const historyTitle = `Scan: ${predictionCondition} — ${predictionExtraction} (${predictionConfidence.toFixed(1)}% Precision)`;
    const historyType = isCaries ? 'caries' : 'cleared';
    const currentAllergies = target.desc.split('Allergies: ')[1]?.split('.')[0] || 'None';
    const newStatus = isCaries ? 'Urgent Care' : 'Healthy Clear';
    const newBadge = isCaries ? 'urgent' : 'cleared';
    const newDesc = `Allergies: ${currentAllergies}. Last Scan: ${predictionCondition} (${predictionExtraction}) on ${new Date().toLocaleDateString()}.`;

    const [{ data: historyRow, error: historyError }, { error: updateError }] = await Promise.all([
      databaseService.addPatientHistory({
        patient_id: target.dbId,
        title: historyTitle,
        type: historyType,
        scan_id: scanId,
        image_url: imageUrl,
      }),
      databaseService.updatePatientStatus(target.dbId, {
        status: newStatus,
        badge: newBadge,
        description: newDesc,
      }),
    ]);

    if (historyError || updateError) {
      console.error('Failed to save scan to Supabase', historyError || updateError);
      return { error: historyError || updateError };
    }

    const newHistoryNode = { date: formatHistoryDate(historyRow.event_date), title: historyRow.title, type: historyRow.type, imageUrl: historyRow.image_url };
    setPatients(prev => prev.map(p => (
      p.dbId === target.dbId
        ? { ...p, status: newStatus, badge: newBadge, desc: newDesc, history: [newHistoryNode, ...p.history] }
        : p
    )));

    return { error: null };
  }, [patients]);

  const updatePatient = useCallback(async (patientDbId, { name, phone, age }) => {
    if (!name.trim()) {
      return { error: new Error('Please enter patient name.') };
    }
    if (!/^\d{10}$/.test(phone || '')) {
      return { error: new Error('Please enter a valid 10-digit mobile number.') };
    }
    const ageNum = Number(age);
    if (!age || Number.isNaN(ageNum) || ageNum <= 0 || ageNum > 119) {
      return { error: new Error('Please enter a valid age.') };
    }

    const { data: updatedPatient, error: updateError } = await databaseService.updatePatientContactInfo(patientDbId, {
      name: name.trim(),
      phone,
      age: ageNum,
    });

    if (updateError) {
      console.error('Failed to update patient contact info in Supabase', updateError);
      return { error: updateError };
    }

    setPatients(prev => prev.map(p => (
      p.dbId === patientDbId ? { ...p, name: updatedPatient.name, phone: updatedPatient.phone || '', age: updatedPatient.age ?? null } : p
    )));

    return { data: updatedPatient, error: null };
  }, []);

  const deletePatient = useCallback(async (patientDbId) => {
    const { error } = await databaseService.deletePatient(patientDbId);
    if (error) {
      console.error('Failed to delete patient in Supabase', error);
      return { error };
    }

    setPatients(prev => prev.filter(p => p.dbId !== patientDbId));

    return { error: null };
  }, []);

  return { patients, patientsLoaded, patientsError, loadPatients, createPatient, updatePatient, deletePatient, saveScanToEHR };
}
