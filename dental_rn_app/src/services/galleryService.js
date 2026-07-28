import { supabase } from './supabaseClient';

/**
 * X-ray Gallery Service
 * Reads real scan records (joined with patients + reports) so every X-ray
 * uploaded via the AI Analysis / Scan flow automatically shows up here —
 * both features read/write the same `scans` table, just through different
 * service modules (scanService.js owns create/update, this owns the
 * gallery-specific read + a couple of gallery-only mutations).
 */

export async function getGalleryScans() {
  try {
    const { data, error } = await supabase
      .from('scans')
      .select('id, patient_id, image_url, prediction, confidence, uploaded_at, status, patients(id, patient_code, name, phone, age), reports(id, severity, recommendation, created_at)')
      .order('uploaded_at', { ascending: false });

    if (error) {
      return { data: null, error: handleGalleryError(error) };
    }
    return { data: data || [], error: null };
  } catch (err) {
    return { data: null, error: handleGalleryError(err) };
  }
}

export async function setFavourite(scanId, favourite) {
  try {
    const { data, error } = await supabase
      .from('scans')
      .update({ favourite })
      .eq('id', scanId)
      .select('id, favourite')
      .single();

    if (error) {
      return { data: null, error: handleGalleryError(error) };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleGalleryError(err) };
  }
}

// Best-effort extraction of the Storage object path from a public bucket URL,
// e.g. ".../storage/v1/object/public/dental-xrays/<userId>/<file>.png" -> "<userId>/<file>.png"
export function storagePathFromPublicUrl(publicUrl) {
  if (!publicUrl) return null;
  const marker = '/dental-xrays/';
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}

function handleGalleryError(error) {
  if (!error) return null;
  const msg = error.message || String(error);
  if (msg.includes('Network request failed') || msg.includes('Failed to fetch')) {
    return new Error('Network error: Unable to reach the X-ray gallery database.');
  }
  if (msg.includes('row-level security') || msg.includes('permission denied')) {
    return new Error('Authentication error: Permission denied by Row Level Security policy.');
  }
  if (msg.includes('favourite')) {
    return new Error("Database error: the 'favourite' column is missing — run the gallery migration in Supabase SQL Editor.");
  }
  return error instanceof Error ? error : new Error(`Database error: ${msg}`);
}
