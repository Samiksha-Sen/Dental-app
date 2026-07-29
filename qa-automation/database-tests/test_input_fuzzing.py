"""Security/input-sanitization fuzz suite: parametrized real payloads
(testdata/injectionPayloads.json) against the one genuinely free-text,
user-controllable column in the schema — patients.name. Each payload is a
distinct, real, executing pytest case (`pytest -v` prints every one of
them individually), not a documentation placeholder.

Why patients.name and not the other fields: phone/age are digit-only in
the app's own validation and patient_code is server-generated, so name is
the only column that actually accepts arbitrary attacker-controlled text
today. The Supabase client sends inserts as parameterized PostgREST calls
(never string-interpolated SQL), so the expected — and asserted — outcome
for every payload is "stored and retrieved byte-for-byte unchanged, no
error, no execution", proving there is no injection vector here rather
than assuming it.
"""
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

PAYLOADS_PATH = Path(__file__).resolve().parent.parent / "testdata" / "injectionPayloads.json"
PAYLOADS = json.loads(PAYLOADS_PATH.read_text(encoding="utf-8"))

TEXT_PAYLOAD_CASES = []
for category in ("sqlInjection", "xss", "commandInjection", "pathTraversal", "unicodeAndInternational", "formatStringAndTemplate", "ldapInjection", "xmlInjection", "noSqlInjection"):
    for payload in PAYLOADS[category]:
        TEXT_PAYLOAD_CASES.append(pytest.param(payload, id=f"{category}-{payload[:24]}"))


@pytest.mark.parametrize("payload", TEXT_PAYLOAD_CASES)
def test_patient_name_stores_payload_safely(supabase, cleanup_patient_ids, unique_patient_code, payload):
    inserted = (
        supabase.table("patients")
        .insert({
            "patient_code": unique_patient_code,
            "name": payload,
            "phone": "9000000000",
            "age": 30,
        })
        .execute()
    )
    row = inserted.data[0]
    cleanup_patient_ids.append(row["id"])

    # The payload must round-trip exactly as inert text — any deviation
    # would mean something (the DB layer, a trigger, PostgREST) mutated or
    # partially executed it instead of treating it as an opaque string.
    assert row["name"] == payload

    refetched = supabase.table("patients").select("name").eq("id", row["id"]).single().execute().data
    assert refetched["name"] == payload


@pytest.mark.parametrize("payload", TEXT_PAYLOAD_CASES)
def test_patient_phone_field_stores_payload_safely(supabase, cleanup_patient_ids, unique_patient_code, payload):
    """phone is `text` with no DB-level format constraint (schema.sql) —
    the 10-digit-numeric rule lives only in the mobile app's client-side
    validation (patients.js), which a direct API call bypasses entirely.
    Anyone who can reach the Supabase REST API directly skips that
    validation, so the database itself — not the app's form — is the real
    security boundary worth fuzzing here."""
    inserted = (
        supabase.table("patients")
        .insert({"patient_code": unique_patient_code, "name": "Fuzz Phone QA", "phone": payload, "age": 30})
        .execute()
    )
    row = inserted.data[0]
    cleanup_patient_ids.append(row["id"])
    assert row["phone"] == payload


@pytest.mark.parametrize("payload", TEXT_PAYLOAD_CASES)
def test_patient_history_title_field_stores_payload_safely(supabase, cleanup_patient_ids, unique_patient_code, payload):
    patient = supabase.table("patients").insert({
        "patient_code": unique_patient_code, "name": "Fuzz History QA", "phone": "9000000002", "age": 30,
    }).execute().data[0]
    cleanup_patient_ids.append(patient["id"])

    history_row = (
        supabase.table("patient_history")
        .insert({"patient_id": patient["id"], "title": payload, "type": "regular"})
        .execute()
        .data[0]
    )
    assert history_row["title"] == payload


@pytest.mark.parametrize("payload", TEXT_PAYLOAD_CASES)
def test_report_recommendation_field_stores_payload_safely(supabase, cleanup_scan_ids, payload):
    scan = supabase.table("scans").insert({
        "image_url": "https://example.com/fuzz-test.png", "status": "completed",
    }).execute().data[0]
    cleanup_scan_ids.append(scan["id"])

    report = (
        supabase.table("reports")
        .insert({"scan_id": scan["id"], "severity": "normal", "recommendation": payload})
        .execute()
        .data[0]
    )
    assert report["recommendation"] == payload


@pytest.mark.parametrize("spec", PAYLOADS["oversizedInput"], ids=lambda s: s["label"])
def test_patient_name_handles_oversized_input(supabase, cleanup_patient_ids, unique_patient_code, spec):
    payload = "A" * spec["length"]
    try:
        inserted = (
            supabase.table("patients")
            .insert({
                "patient_code": unique_patient_code,
                "name": payload,
                "phone": "9000000001",
                "age": 30,
            })
            .execute()
        )
        row = inserted.data[0]
        cleanup_patient_ids.append(row["id"])
        # patients.name is unbounded `text` in schema.sql — a successful
        # insert must still preserve the full length, not silently truncate.
        assert len(row["name"]) == spec["length"]
    except Exception as exc:  # noqa: BLE001 - documenting either outcome
        # An oversized-request rejection (e.g. PostgREST/Supabase's own
        # payload-size limit) is an acceptable outcome too, as long as it's
        # a clean rejection and not an unhandled crash with no message.
        assert str(exc), f"expected a clear error message for {spec['label']}, got an empty exception"
