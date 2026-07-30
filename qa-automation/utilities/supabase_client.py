"""Supabase client for direct table validation.

Uses the service-role key (bypasses Row Level Security) rather than the
anon key the mobile app uses, because these tests need to assert on
ground-truth table state regardless of which user session created it —
that's a different concern from the app's own RLS-scoped reads/writes,
which the mobile UI tests already exercise through the real app.
"""
import os
import re

from supabase import create_client


def normalize_supabase_url(url: str) -> str:
    """Normalizes a Supabase URL so that even if a user pastes a Studio/Dashboard URL
    (e.g., https://supabase.com/dashboard/project/<ref> or https://supabase.com/studio),
    or includes trailing slashes/API paths, it resolves to https://<project-ref>.supabase.co.
    """
    if not url:
        return url
    clean = str(url).strip().rstrip("/")
    match = re.search(
        r"(?:supabase\.(?:com|io|co)|app\.supabase\.com)/(?:dashboard/)?(?:project|studio)/([a-zA-Z0-9_-]+)",
        clean,
        re.IGNORECASE,
    )
    if match:
        return f"https://{match.group(1)}.supabase.co"

    for suffix in (
        "/rest/v1",
        "/auth/v1",
        "/storage/v1",
        "/realtime/v1",
        "/functions/v1",
    ):
        if clean.endswith(suffix):
            clean = clean[: -len(suffix)]

    if not clean.startswith("http://") and not clean.startswith("https://"):
        clean = f"https://{clean}"

    return clean


def get_test_supabase_client():
    url = normalize_supabase_url(os.environ["SUPABASE_URL"])
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ["SUPABASE_KEY"]
    return create_client(url, key)


def cleanup_by_ids(client, table, ids):
    """Best-effort teardown helper so failed assertions don't leak test rows
    into the next run's `getNextPatientCode()` sequence or table counts."""
    if not ids:
        return
    client.table(table).delete().in_("id", ids).execute()
