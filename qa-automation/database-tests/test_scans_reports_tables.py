"""Validates `scans` + `reports`, the tables scanService.js and
databaseService.js write to during the X-ray upload -> AI prediction ->
save-to-EHR flow (see dental_rn_app/app/(portal)/scan.js)."""


def test_insert_scan_record(supabase, cleanup_scan_ids):
    scan = (
        supabase.table("scans")
        .insert({
            "image_url": "https://example.com/qa-test-xray.png",
            "status": "processing",
        })
        .execute()
        .data[0]
    )
    cleanup_scan_ids.append(scan["id"])

    assert scan["status"] == "processing"
    assert scan["prediction"] is None


def test_update_scan_prediction_after_ai_response(supabase, cleanup_scan_ids):
    scan = supabase.table("scans").insert({
        "image_url": "https://example.com/qa-test-xray.png",
        "status": "processing",
    }).execute().data[0]
    cleanup_scan_ids.append(scan["id"])

    updated = (
        supabase.table("scans")
        .update({"prediction": "Caries Detected", "confidence": 91.5, "status": "completed"})
        .eq("id", scan["id"])
        .execute()
        .data[0]
    )
    assert updated["prediction"] == "Caries Detected"
    assert updated["confidence"] == 91.5
    assert updated["status"] == "completed"


def test_create_report_linked_to_scan(supabase, cleanup_scan_ids):
    scan = supabase.table("scans").insert({
        "image_url": "https://example.com/qa-test-xray.png",
        "status": "completed",
    }).execute().data[0]
    cleanup_scan_ids.append(scan["id"])

    report = (
        supabase.table("reports")
        .insert({
            "scan_id": scan["id"],
            "severity": "high",
            "recommendation": "Consultation for restorative treatment (Filling or RCT)",
        })
        .execute()
        .data[0]
    )
    assert report["scan_id"] == scan["id"]
    assert report["severity"] == "high"


def test_delete_scan_removes_row(supabase):
    scan = supabase.table("scans").insert({
        "image_url": "https://example.com/qa-test-xray.png",
        "status": "processing",
    }).execute().data[0]

    supabase.table("scans").delete().eq("id", scan["id"]).execute()

    remaining = supabase.table("scans").select("id").eq("id", scan["id"]).execute().data
    assert remaining == []


def test_fetch_reports_by_scan_ordered_newest_first(supabase, cleanup_scan_ids):
    scan = supabase.table("scans").insert({
        "image_url": "https://example.com/qa-test-xray.png",
        "status": "completed",
    }).execute().data[0]
    cleanup_scan_ids.append(scan["id"])

    supabase.table("reports").insert({"scan_id": scan["id"], "severity": "normal", "recommendation": "first"}).execute()
    supabase.table("reports").insert({"scan_id": scan["id"], "severity": "normal", "recommendation": "second"}).execute()

    reports = (
        supabase.table("reports")
        .select("*")
        .eq("scan_id", scan["id"])
        .order("created_at", desc=True)
        .execute()
        .data
    )
    assert len(reports) == 2
    assert reports[0]["recommendation"] == "second"
