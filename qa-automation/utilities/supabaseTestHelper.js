// JS-side Supabase client for the Mocha mobile-tests suite (cross-checking
// UI-displayed values against ground truth). The equivalent Python client
// for database-tests/ (pytest) is utilities/supabase_client.py — kept
// separate because the two suites run in different runtimes/CI steps.
const { createClient } = require('@supabase/supabase-js');

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

function get_test_supabase_client() {
  const url = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY) must be set to run DB-cross-check assertions.');
  }
  return createClient(url, key);
}

module.exports = { get_test_supabase_client, normalizeSupabaseUrl };
