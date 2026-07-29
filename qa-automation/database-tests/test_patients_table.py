"""Validates the `patients` + `patient_history` tables directly against
schema.sql, independent of the mobile UI. Mirrors the operations
databaseService.js performs (insert/update/delete/select) so a schema or RLS
regression is caught here even if the UI test suite isn't run."""
import pytest


def test_insert_patient_persists_expected_columns(supabase, cleanup_patient_ids, unique_patient_code):
    inserted = (
        supabase.table("patients")
        .insert({
            "patient_code": unique_patient_code,
            "name": "DB QA Test Patient",
            "phone": "9999999999",
            "age": 30,
            "status": "Healthy Clear",
            "badge": "normal",
            "description": "inserted by database-tests",
        })
        .execute()
    )
    row = inserted.data[0]
    cleanup_patient_ids.append(row["id"])

    assert row["patient_code"] == unique_patient_code
    assert row["name"] == "DB QA Test Patient"
    assert row["phone"] == "9999999999"
    assert row["age"] == 30


def test_fetch_patient_by_id(supabase, cleanup_patient_ids, unique_patient_code):
    created = supabase.table("patients").insert({
        "patient_code": unique_patient_code,
        "name": "Fetch QA Patient",
        "phone": "9888888888",
        "age": 45,
    }).execute().data[0]
    cleanup_patient_ids.append(created["id"])

    fetched = supabase.table("patients").select("*").eq("id", created["id"]).single().execute().data
    assert fetched["id"] == created["id"]
    assert fetched["name"] == "Fetch QA Patient"


def test_update_patient_contact_info(supabase, cleanup_patient_ids, unique_patient_code):
    created = supabase.table("patients").insert({
        "patient_code": unique_patient_code,
        "name": "Update QA Patient",
        "phone": "9777777777",
        "age": 22,
    }).execute().data[0]
    cleanup_patient_ids.append(created["id"])

    updated = (
        supabase.table("patients")
        .update({"name": "Updated QA Patient", "phone": "9666666666", "age": 23})
        .eq("id", created["id"])
        .execute()
        .data[0]
    )
    assert updated["name"] == "Updated QA Patient"
    assert updated["phone"] == "9666666666"
    assert updated["age"] == 23


def test_delete_patient_removes_row(supabase, unique_patient_code):
    created = supabase.table("patients").insert({
        "patient_code": unique_patient_code,
        "name": "Delete QA Patient",
        "phone": "9555555555",
        "age": 50,
    }).execute().data[0]

    supabase.table("patients").delete().eq("id", created["id"]).execute()

    remaining = supabase.table("patients").select("id").eq("id", created["id"]).execute().data
    assert remaining == []


def test_patient_history_links_to_patient_via_foreign_key(supabase, cleanup_patient_ids, unique_patient_code):
    patient = supabase.table("patients").insert({
        "patient_code": unique_patient_code,
        "name": "History QA Patient",
        "phone": "9444444444",
        "age": 38,
    }).execute().data[0]
    cleanup_patient_ids.append(patient["id"])

    history_row = (
        supabase.table("patient_history")
        .insert({
            "patient_id": patient["id"],
            "title": "Registration",
            "type": "registration",
        })
        .execute()
        .data[0]
    )

    fetched = (
        supabase.table("patients")
        .select("id, patient_history(id, title, type)")
        .eq("id", patient["id"])
        .single()
        .execute()
        .data
    )
    assert any(h["id"] == history_row["id"] and h["title"] == "Registration" for h in fetched["patient_history"])


def test_duplicate_patient_code_is_rejected(supabase, cleanup_patient_ids, unique_patient_code):
    """patient_code has a DB-level `unique` constraint (schema.sql) — unlike
    patients.name (see patientManagement.test.js's duplicate-name case,
    which the app *allows*), the database itself must reject a second row
    with the same code, independent of whatever the app's own
    getNextPatientCode() sequencing does."""
    first = supabase.table("patients").insert({
        "patient_code": unique_patient_code,
        "name": "Duplicate Code QA Patient A",
        "phone": "9222222222",
        "age": 33,
    }).execute().data[0]
    cleanup_patient_ids.append(first["id"])

    with pytest.raises(Exception) as exc_info:
        supabase.table("patients").insert({
            "patient_code": unique_patient_code,
            "name": "Duplicate Code QA Patient B",
            "phone": "9111111111",
            "age": 40,
        }).execute()

    message = str(exc_info.value).lower()
    assert "duplicate" in message or "unique" in message or "23505" in message


def test_deleting_patient_cascades_to_patient_history(supabase, unique_patient_code):
    patient = supabase.table("patients").insert({
        "patient_code": unique_patient_code,
        "name": "Cascade QA Patient",
        "phone": "9333333333",
        "age": 29,
    }).execute().data[0]

    history_row = supabase.table("patient_history").insert({
        "patient_id": patient["id"],
        "title": "Registration",
        "type": "registration",
    }).execute().data[0]

    supabase.table("patients").delete().eq("id", patient["id"]).execute()

    remaining_history = (
        supabase.table("patient_history").select("id").eq("id", history_row["id"]).execute().data
    )
    assert remaining_history == [], "patient_history rows should cascade-delete with their parent patient (schema.sql: on delete cascade)"
