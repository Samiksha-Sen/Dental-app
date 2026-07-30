"""Unit tests for Supabase URL normalization to ensure Dashboard/Studio URLs,
trailing slashes, and API path suffixes pasted into SUPABASE_URL are cleanly
converted to https://<project-ref>.supabase.co.
"""

from utilities.supabase_client import normalize_supabase_url


def test_normalize_supabase_dashboard_url():
    raw = "https://supabase.com/dashboard/project/gyxzktlwfomztrhlyqwv"
    assert normalize_supabase_url(raw) == "https://gyxzktlwfomztrhlyqwv.supabase.co"


def test_normalize_supabase_studio_url_with_trailing_path():
    raw = "https://supabase.com/dashboard/project/06955798704d/editor/29482"
    assert normalize_supabase_url(raw) == "https://06955798704d.supabase.co"


def test_normalize_supabase_url_with_trailing_slash():
    raw = "https://gyxzktlwfomztrhlyqwv.supabase.co/"
    assert normalize_supabase_url(raw) == "https://gyxzktlwfomztrhlyqwv.supabase.co"


def test_normalize_supabase_url_with_rest_suffix():
    raw = "https://gyxzktlwfomztrhlyqwv.supabase.co/rest/v1"
    assert normalize_supabase_url(raw) == "https://gyxzktlwfomztrhlyqwv.supabase.co"


def test_normalize_valid_supabase_url():
    raw = "https://gyxzktlwfomztrhlyqwv.supabase.co"
    assert normalize_supabase_url(raw) == "https://gyxzktlwfomztrhlyqwv.supabase.co"


def test_normalize_empty_url():
    assert normalize_supabase_url("") == ""
    assert normalize_supabase_url(None) is None
