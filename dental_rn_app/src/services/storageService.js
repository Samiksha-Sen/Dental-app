import { supabase } from './supabaseClient';
import { Platform } from 'react-native';

const BUCKET_NAME = 'dental-xrays';

/**
 * Uploads a dental X-ray image to Supabase Storage bucket: dental-xrays
 * Stores image under: user-id/image-name.png
 * Returns path and public URL.
 */
export async function uploadXray(uri, userId, customFileName = null) {
  try {
    if (!uri) {
      return { path: null, publicUrl: null, error: new Error('Upload failure: Image URI is empty.') };
    }

    const safeUserId = userId || '00000000-0000-0000-0000-000000000000';
    const fileName = customFileName || `xray_${Date.now()}.png`;
    const filePath = `${safeUserId}/${fileName}`;

    // Convert local URI to Blob
    let blob;
    try {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image from URI: ${uri}`);
      }
      blob = await response.blob();
    } catch (networkErr) {
      return {
        path: null,
        publicUrl: null,
        error: new Error(`Network error: Unable to read image file — ${networkErr.message}`),
      };
    }

    const contentType = blob.type || 'image/png';

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, blob, {
        contentType,
        upsert: true,
      });

    if (error) {
      return { path: null, publicUrl: null, error: handleStorageError(error) };
    }

    // Retrieve public URL
    const { data: publicData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      path: filePath,
      publicUrl: publicData?.publicUrl || uri,
      error: null,
    };
  } catch (err) {
    return { path: null, publicUrl: null, error: handleStorageError(err) };
  }
}

/**
 * Helper to get the public URL of a file stored in dental-xrays
 */
export function getXrayPublicUrl(filePath) {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  return data?.publicUrl || null;
}

/**
 * Delete an X-ray image from Supabase Storage
 */
export async function deleteXray(filePath) {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      return { data: null, error: handleStorageError(error) };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleStorageError(err) };
  }
}

function handleStorageError(error) {
  if (!error) return null;
  const msg = error.message || String(error);
  if (msg.includes('Network request failed') || msg.includes('Failed to fetch')) {
    return new Error('Network error: Unable to communicate with Supabase Storage.');
  }
  if (msg.includes('row-level security') || msg.includes('permission denied')) {
    return new Error('Authentication error: Permission denied when accessing storage bucket.');
  }
  return error instanceof Error ? error : new Error(`Upload failure: ${msg}`);
}
