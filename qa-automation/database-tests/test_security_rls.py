"""Documents the *actual current* Row Level Security posture (schema.sql),
rather than asserting an idealized "everything is locked down" that would
just fail against the real, intentionally-permissive-for-now configuration
(see schema.sql's own top-of-file note, and README.md's Module 14 findings).

Uses the anon key (not the service-role key `supabase` fixture used
elsewhere in database-tests/) because RLS only applies to non-service-role
requests — the service role bypasses it entirely, which is why every other
test file in this directory deliberately uses it for ground-truth setup.
"""
import os

import pytest
from supabase import create_client


@pytest.fixture(scope="session")
def anon_supabase():
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_KEY"]  # anon/public key, not the service role
    return create_client(url, key)


def test_patient_history_is_readable_without_authentication(anon_supabase):
    """TC_SEC_003. schema.sql's policy is `using (true)` — any caller, signed
    in or not, can read patient_history today. This is a documented finding
    of the current (permissive) state, not a security guarantee being
    endorsed — see README.md Module 14."""
    response = anon_supabase.table("patient_history").select("id").limit(1).execute()
    assert response.data is not None  # no RLS-denial error raised


def test_scans_table_permits_anon_access(anon_supabase):
    """Same finding as above for `scans`: policy is
    `auth.uid() = user_id OR auth.role() = 'anon'` — the OR clause means an
    anonymous caller is explicitly allowed, by design, not by oversight."""
    response = anon_supabase.table("scans").select("id").limit(1).execute()
    assert response.data is not None


def test_profiles_table_enforces_per_user_isolation(anon_supabase, supabase):
    """TC_SEC_006. Unlike the tables above, `profiles`' policy is
    `auth.uid() = id` with no anon carve-out. An anonymous client's
    `auth.uid()` is null, which never equals a real profile id, so RLS
    filters every row out — this is the one table that actually enforces
    isolation today, and is worth keeping that way as other tables get
    locked down later."""
    import uuid

    email = f"qa-rls-test-{uuid.uuid4().hex[:10]}@example.com"
    created_user = supabase.auth.admin.create_user({
        "email": email,
        "password": "TempPassword123!",
        "email_confirm": True,
    }).user
    supabase.table("profiles").upsert({
        "id": created_user.id,
        "full_name": "RLS QA Target",
        "email": email,
    }).execute()

    try:
        response = anon_supabase.table("profiles").select("id").eq("id", created_user.id).execute()
        assert response.data == [], "anon client should not be able to read another user's profile row"
    finally:
        supabase.auth.admin.delete_user(created_user.id)
