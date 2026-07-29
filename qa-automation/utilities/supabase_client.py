"""Supabase client for direct table validation.

Uses the service-role key (bypasses Row Level Security) rather than the
anon key the mobile app uses, because these tests need to assert on
ground-truth table state regardless of which user session created it —
that's a different concern from the app's own RLS-scoped reads/writes,
which the mobile UI tests already exercise through the real app.
"""
import os

from supabase import create_client


def get_test_supabase_client():
    url = os.environ["SUPABASE_URL"]
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ["SUPABASE_KEY"]
    return create_client(url, key)


def cleanup_by_ids(client, table, ids):
    """Best-effort teardown helper so failed assertions don't leak test rows
    into the next run's `getNextPatientCode()` sequence or table counts."""
    if not ids:
        return
    client.table(table).delete().in_("id", ids).execute()
