import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

function normalizeSupabaseUrl(url) {
  if (!url) return url;
  let clean = String(url)
    .trim()
    .replace(/\/+$/, '');
  const match = clean.match(
    /(?:supabase\.(?:com|io|co)|app\.supabase\.com)\/(?:dashboard\/)?(?:project|studio)\/([a-zA-Z0-9_-]+)/i
  );
  if (match && match[1]) {
    return `https://${match[1]}.supabase.co`;
  }
  clean = clean.replace(/\/(?:rest|auth|storage|realtime|functions)\/v1$/, '');
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`;
  }
  return clean;
}

// Read credentials strictly from environment variables (Requirement 2, 12, 13)
const rawUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseUrl = normalizeSupabaseUrl(rawUrl);
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    'Warning: SUPABASE_URL and/or SUPABASE_ANON_KEY environment variables are not set. Check your .env file.'
  );
}

// Falls back to a syntactically valid placeholder URL when unconfigured so
// createClient() doesn't throw at module load (which would crash the whole
// bundle, including static export and the public marketing pages that don't
// need Supabase at all). Real auth/DB calls will simply fail over the
// network in that case, which the app's existing error-handling already
// surfaces to the user.
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-anon-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

export { normalizeSupabaseUrl };
