"""Fuzzes /predict's `threshold` form field and uploaded filename with the
same real payload set used against the database layer
(testdata/injectionPayloads.json) — a different attack surface (a Flask
form field parsed with `float(request.form.get(...))`, and a filename used
to build a server-side path), so the expected-safe outcome differs from
the DB fuzz suite: app.py should reject non-numeric thresholds cleanly
(currently via an unhandled ValueError — see the finding below) rather
than crash unrecoverably or, worse, execute anything.
"""
import json
import sys
from pathlib import Path

import pytest
import requests

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

PAYLOADS = json.loads((Path(__file__).resolve().parent.parent / "testdata" / "injectionPayloads.json").read_text(encoding="utf-8"))

NON_NUMERIC_THRESHOLD_PAYLOADS = (
    PAYLOADS["sqlInjection"] + PAYLOADS["xss"] + PAYLOADS["commandInjection"] + PAYLOADS["formatStringAndTemplate"]
)


@pytest.mark.parametrize("payload", NON_NUMERIC_THRESHOLD_PAYLOADS, ids=lambda p: p[:24])
def test_predict_rejects_non_numeric_threshold_without_crashing(backend_url, positive_xray_path, payload):
    """FINDING, not a passing guarantee: app.py does
    `float(request.form.get("threshold", 0.85))` with no try/except — a
    non-numeric threshold raises an unhandled ValueError, which Flask turns
    into a generic 500 response rather than app.py's own clean
    `{"error": ...}` shape. This test documents that current behavior
    (a 500, not a crash of the *process*) so a future fix that adds proper
    validation has a regression test to flip green.
    """
    with open(positive_xray_path, "rb") as fh:
        files = {"file": (positive_xray_path.name, fh.read(), "image/png")}
    response = requests.post(f"{backend_url}/predict", files=files, data={"threshold": payload})

    # However Flask responds, it must be a clean HTTP response — not a
    # connection reset / hung request that would indicate the injection
    # payload reached a shell or a query rather than Python's float().
    assert response.status_code in (200, 400, 500)


FILENAME_PAYLOADS = PAYLOADS["pathTraversal"] + PAYLOADS["nullByteAndEncoding"] + PAYLOADS["unicodeAndInternational"]


@pytest.mark.parametrize("payload", FILENAME_PAYLOADS, ids=lambda p: p[:24])
def test_predict_handles_malicious_filenames_without_path_traversal(backend_url, positive_xray_path, payload):
    """app.py builds its temp filename as
    f"xray_{timestamp}_{file.filename}" with no sanitization (no
    werkzeug.utils.secure_filename call) — a real, currently-unmitigated
    gap, not a defense-in-depth the code has on purpose. The prepended
    "xray_<timestamp>_" merges into whatever the payload's first path
    segment is (e.g. "../../../etc/passwd" becomes a literal segment
    "xray_169900..._.." rather than the OS's special ".." parent-directory
    token), so `file.save()` raises FileNotFoundError instead of actually
    escaping UPLOAD_FOLDER — but that's an accident of string
    concatenation order, not intentional sanitization, and this test only
    proves the current effective behavior, not that it's safe by design.
    """
    with open(positive_xray_path, "rb") as fh:
        content = fh.read()
    files = {"file": (payload, content, "image/png")}
    response = requests.post(f"{backend_url}/predict", files=files, data={"threshold": "0.85"})
    assert response.status_code == 200
    body = response.json()
    # Whichever path it took (predicted or rejected-as-invalid), it must be
    # app.py's own well-formed JSON shape, not a stack trace.
    assert "condition" in body or "error" in body
