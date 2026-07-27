import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Read credentials strictly from environment variables (Requirement 2, 12, 13)
const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
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
