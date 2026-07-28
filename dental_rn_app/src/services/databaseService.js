import { supabase } from './supabaseClient';

/**
 * Database Service for Dental AI
 * Provides CRUD operations for profiles, reports, patients, and patient_history.
 */

// ==========================
// PROFILES TABLE
// ==========================

export async function getProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at')
      .eq('id', userId)
      .single();

    if (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleDatabaseError(err) };
  }
}

export async function upsertProfile({ id, full_name, email }) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id,
        full_name,
        email,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleDatabaseError(err) };
  }
}

// ==========================
// REPORTS TABLE
// ==========================

export async function createReport({ scan_id, severity, recommendation }) {
  try {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        scan_id,
        severity,
        recommendation,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleDatabaseError(err) };
  }
}

export async function getReportsByScan(scanId) {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('id, scan_id, severity, recommendation, created_at')
      .eq('scan_id', scanId)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
    return { data: data || [], error: null };
  } catch (err) {
    return { data: null, error: handleDatabaseError(err) };
  }
}

// ==========================
// PATIENTS & HISTORY TABLE
// ==========================

export async function getPatients() {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('id, patient_code, name, phone, age, status, badge, description, patient_history(id, title, type, event_date, image_url, scan_id)')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
    return { data: data || [], error: null };
  } catch (err) {
    return { data: null, error: handleDatabaseError(err) };
  }
}

// Computes the next auto-incrementing hospital Patient ID in the form
// PAT-0001, PAT-0002, ... by finding the highest existing PAT-#### code and
// adding 1. Legacy/non-matching codes (e.g. old PT-##### values) are simply
// ignored rather than breaking the sequence.
export async function getNextPatientCode() {
  try {
    const { data, error } = await supabase.from('patients').select('patient_code');
    if (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
    let maxNumber = 0;
    (data || []).forEach((row) => {
      const match = /^PAT-(\d+)$/.exec(row.patient_code || '');
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    });
    const nextCode = `PAT-${String(maxNumber + 1).padStart(4, '0')}`;
    return { data: nextCode, error: null };
  } catch (err) {
    return { data: null, error: handleDatabaseError(err) };
  }
}

export async function createPatient({ patient_code, name, phone, age, status, badge, description }) {
  try {
    const { data, error } = await supabase
      .from('patients')
      .insert({
        patient_code,
        name,
        phone,
        age,
        status,
        badge,
        description,
      })
      .select('id, patient_code, name, phone, age, status, badge, description')
      .single();

    if (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleDatabaseError(err) };
  }
}

export async function updatePatientContactInfo(patientId, { name, phone, age }) {
  try {
    const { data, error } = await supabase
      .from('patients')
      .update({ name, phone, age })
      .eq('id', patientId)
      .select('id, patient_code, name, phone, age, status, badge, description')
      .single();

    if (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleDatabaseError(err) };
  }
}

export async function deletePatient(patientId) {
  try {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', patientId);

    if (error) {
      return { error: handleDatabaseError(error) };
    }
    return { error: null };
  } catch (err) {
    return { error: handleDatabaseError(err) };
  }
}

export async function updatePatientStatus(patientId, { status, badge, description }) {
  try {
    const { data, error } = await supabase
      .from('patients')
      .update({ status, badge, description })
      .eq('id', patientId)
      .select()
      .single();

    if (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleDatabaseError(err) };
  }
}

export async function addPatientHistory({ patient_id, title, type, scan_id, image_url }) {
  try {
    const { data, error } = await supabase
      .from('patient_history')
      .insert({
        patient_id,
        title,
        type,
        scan_id: scan_id || null,
        image_url: image_url || null,
      })
      .select('id, title, type, event_date, image_url, scan_id')
      .single();

    if (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleDatabaseError(err) };
  }
}

function handleDatabaseError(error) {
  if (!error) return null;
  const msg = error.message || String(error);
  if (msg.includes('Network request failed') || msg.includes('Failed to fetch')) {
    return new Error('Network error: Unable to reach database server.');
  }
  if (msg.includes('row-level security') || msg.includes('permission denied')) {
    return new Error('Authentication error: Permission denied by Row Level Security policy.');
  }
  if (msg.includes('JWT expired')) {
    return new Error('Session expiration: Your login session has expired. Please log in again.');
  }
  return error instanceof Error ? error : new Error(`Database error: ${msg}`);
}
