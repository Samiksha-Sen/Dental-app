import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from utilities.image_factory import (  # noqa: E402
    blank_image_path,
    corrupted_image_path,
    non_xray_photo_path,
    unsupported_format_path,
)

# app.py never sets an explicit HTTP status code — every response, success
# or error, comes back as `jsonify({...})` with the Flask default of 200.
# The real signal for success/failure is the presence of an "error" key, not
# the status code. Tests assert on that contract, not on 4xx/5xx codes.


@pytest.mark.smoke
def test_predict_valid_xray_returns_condition_and_confidence(api_client, positive_xray_path):
    response = api_client.predict(positive_xray_path, threshold=0.85)
    assert response.status_code == 200

    body = response.json()
    assert "error" not in body, f"expected a prediction, got error: {body.get('error')}"
    assert body["condition"] in ("Caries Found", "No Caries Detected")
    assert isinstance(body["confidence"], (int, float))
    assert 0 <= body["confidence"] <= 100
    assert body["extraction"]


def test_predict_confidence_moves_with_threshold(api_client, positive_xray_path):
    """Sanity check on predict_caries()'s branching: a much higher threshold
    should never flip a "Caries Found" result to found at higher confidence
    than it already was scored at — this just proves threshold is actually
    wired through, not hardcoded."""
    low = api_client.predict(positive_xray_path, threshold=0.01).json()
    high = api_client.predict(positive_xray_path, threshold=0.99).json()
    assert "error" not in low and "error" not in high
    # With threshold≈0.01 nearly everything reads as "Caries Found"; with
    # threshold≈0.99 nearly everything reads as "No Caries Detected".
    assert low["condition"] == "Caries Found"
    assert high["condition"] == "No Caries Detected"


def test_predict_rejects_blank_image(api_client):
    response = api_client.predict(blank_image_path(), threshold=0.85)
    body = response.json()
    assert "error" in body
    assert "X-ray not found" in body["error"]


def test_predict_rejects_corrupted_image(api_client):
    response = api_client.predict(corrupted_image_path(), threshold=0.85)
    body = response.json()
    assert "error" in body
    assert "corrupted" in body["error"].lower() or "invalid" in body["error"].lower()


def test_predict_rejects_unsupported_file_format(api_client):
    response = api_client.predict(unsupported_format_path(), threshold=0.85, content_type="text/plain")
    body = response.json()
    assert "error" in body


def test_predict_rejects_non_xray_photo(api_client):
    response = api_client.predict(non_xray_photo_path(), threshold=0.85)
    body = response.json()
    assert "error" in body
    assert "X-ray not found" in body["error"]


def test_predict_missing_file_field_returns_error(api_client, backend_url):
    import requests

    response = requests.post(f"{backend_url}/predict", data={"threshold": "0.85"})
    body = response.json()
    assert body["error"] == "No file uploaded"


def test_predict_latency_is_within_budget(api_client, positive_xray_path):
    response = api_client.predict(positive_xray_path, threshold=0.85)
    # Two model inferences (validator + caries) per request on CPU; generous
    # budget to avoid CI-runner flakiness rather than pinning tight SLOs.
    assert response.elapsed.total_seconds() < 15.0
