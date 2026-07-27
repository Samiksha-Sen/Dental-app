import { supabase } from './supabaseClient';

/**
 * Scan Service for Dental AI
 * Manages scan records in PostgreSQL 'scans' table and updates prediction/confidence results.
 */

/**
 * Create an initial scan record when user uploads an X-Ray
 */
export async function createScanRecord({ userId, patientId, imageUrl, status = 'processing' }) {
  try {
    const { data, error } = await supabase
      .from('scans')
      .insert({
        user_id: userId || null,
        patient_id: patientId || null,
        image_url: imageUrl,
        status: status,
        uploaded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: handleScanError(error) };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleScanError(err) };
  }
}

/**
 * Automatically update the corresponding scan record after Flask AI API returns:
 * { "prediction": "Caries Detected", "confidence": 0.94 }
 */
export async function updateScanPrediction(scanId, { prediction, confidence, status = 'completed' }) {
  try {
    if (!scanId) {
      return { data: null, error: new Error('Missing scanId for updating scan prediction.') };
    }

    const { data, error } = await supabase
      .from('scans')
      .update({
        prediction: prediction,
        confidence: Number(confidence) || 0,
        status: status,
      })
      .eq('id', scanId)
      .select()
      .single();

    if (error) {
      return { data: null, error: handleScanError(error) };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleScanError(err) };
  }
}

/**
 * Fetch all scans belonging to a user (for scan history)
 */
export async function getScansByUser(userId) {
  try {
    let query = supabase.from('scans').select('*').order('uploaded_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: handleScanError(error) };
    }
    return { data: data || [], error: null };
  } catch (err) {
    return { data: null, error: handleScanError(err) };
  }
}

/**
 * Retrieve a specific scan record by ID
 */
export async function getScanById(scanId) {
  try {
    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .eq('id', scanId)
      .single();

    if (error) {
      return { data: null, error: handleScanError(error) };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleScanError(err) };
  }
}

/**
 * Delete a scan record by ID
 */
export async function deleteScan(scanId) {
  try {
    const { data, error } = await supabase
      .from('scans')
      .delete()
      .eq('id', scanId);

    if (error) {
      return { data: null, error: handleScanError(error) };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleScanError(err) };
  }
}

function handleScanError(error) {
  if (!error) return null;
  const msg = error.message || String(error);
  if (msg.includes('Network request failed') || msg.includes('Failed to fetch')) {
    return new Error('Network error: Unable to connect to Supabase to update scan records.');
  }
  if (msg.includes('row-level security') || msg.includes('permission denied')) {
    return new Error('Authentication error: RLS permission denied for scans table.');
  }
  if (msg.includes('JWT expired')) {
    return new Error('Session expiration: Your login session has expired.');
  }
  return error instanceof Error ? error : new Error(`Database error: ${msg}`);
}
