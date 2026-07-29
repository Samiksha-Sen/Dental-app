"""Validates the `profiles` table, which authService.js's signUp() upserts
into right after supabase.auth.signUp() succeeds. profiles.id is a FK to
auth.users(id), so these tests create/delete a real auth user via the
Supabase admin API (requires SUPABASE_SERVICE_ROLE_KEY) rather than
inserting an arbitrary uuid that would violate the foreign key.
"""
import uuid

import pytest


@pytest.fixture
def auth_user(supabase):
    email = f"qa-db-test-{uuid.uuid4().hex[:10]}@example.com"
    created = supabase.auth.admin.create_user({
        "email": email,
        "password": "TempPassword123!",
        "email_confirm": True,
    })
    user = created.user
    yield user
    supabase.auth.admin.delete_user(user.id)  # cascades to profiles via schema.sql FK


def test_upsert_profile_after_signup(supabase, auth_user):
    profile = (
        supabase.table("profiles")
        .upsert({
            "id": auth_user.id,
            "full_name": "QA Automation Clinician",
            "email": auth_user.email,
        })
        .execute()
        .data[0]
    )
    assert profile["id"] == auth_user.id
    assert profile["full_name"] == "QA Automation Clinician"
    assert profile["email"] == auth_user.email


def test_fetch_profile_by_id(supabase, auth_user):
    supabase.table("profiles").upsert({
        "id": auth_user.id,
        "full_name": "Fetch QA Clinician",
        "email": auth_user.email,
    }).execute()

    fetched = supabase.table("profiles").select("*").eq("id", auth_user.id).single().execute().data
    assert fetched["full_name"] == "Fetch QA Clinician"


def test_deleting_auth_user_cascades_to_profile(supabase):
    email = f"qa-db-cascade-{uuid.uuid4().hex[:10]}@example.com"
    created_user = supabase.auth.admin.create_user({
        "email": email,
        "password": "TempPassword123!",
        "email_confirm": True,
    }).user

    supabase.table("profiles").upsert({
        "id": created_user.id,
        "full_name": "Cascade QA Clinician",
        "email": email,
    }).execute()

    supabase.auth.admin.delete_user(created_user.id)

    remaining = supabase.table("profiles").select("id").eq("id", created_user.id).execute().data
    assert remaining == [], "profiles row should cascade-delete with its auth.users row (schema.sql: on delete cascade)"
