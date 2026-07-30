import os
import sys
import uuid
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from utilities.supabase_client import get_test_supabase_client, normalize_supabase_url  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def normalize_env_supabase_url():
    if "SUPABASE_URL" in os.environ and os.environ["SUPABASE_URL"]:
        os.environ["SUPABASE_URL"] = normalize_supabase_url(os.environ["SUPABASE_URL"])


@pytest.fixture(scope="session")
def supabase(normalize_env_supabase_url):
    return get_test_supabase_client()


@pytest.fixture
def cleanup_patient_ids(supabase):
    """Tests register the ids they create; teardown deletes them regardless
    of pass/fail so a failed assertion doesn't leak rows that skew later
    dashboard-count / getNextPatientCode() tests."""
    ids = []
    yield ids
    if ids:
        supabase.table("patients").delete().in_("id", ids).execute()


@pytest.fixture
def cleanup_scan_ids(supabase):
    ids = []
    yield ids
    if ids:
        supabase.table("reports").delete().in_("scan_id", ids).execute()
        supabase.table("scans").delete().in_("id", ids).execute()


@pytest.fixture
def unique_patient_code():
    return f"PAT-QA-{uuid.uuid4().hex[:8]}"
