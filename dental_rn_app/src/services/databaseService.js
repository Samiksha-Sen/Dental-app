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
      .select('id, patient_code, name, status, badge, description, patient_history(id, title, type, event_date, image_url, scan_id)')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
    return { data: data || [], error: null };
  } catch (err) {
    return { data: null, error: handleDatabaseError(err) };
  }
}

export async function createPatient({ patient_code, name, status, badge, description }) {
  try {
    const { data, error } = await supabase
      .from('patients')
      .insert({
        patient_code,
        name,
        status,
        badge,
        description,
      })
      .select('id, patient_code, name, status, badge, description')
      .single();

    if (error) {
      return { data: null, error: handleDatabaseError(error) };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleDatabaseError(err) };
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
