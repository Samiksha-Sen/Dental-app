// JS-side Supabase client for the Mocha mobile-tests suite (cross-checking
// UI-displayed values against ground truth). The equivalent Python client
// for database-tests/ (pytest) is utilities/supabase_client.py — kept
// separate because the two suites run in different runtimes/CI steps.
const { createClient } = require('@supabase/supabase-js');

function get_test_supabase_client() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY) must be set to run DB-cross-check assertions.');
  }
  return createClient(url, key);
}

module.exports = { get_test_supabase_client };
