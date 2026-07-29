"""Thin wrapper around requests that logs every call for the Excel "API
Results" sheet and the run log, so api-tests/ never has to duplicate that
bookkeeping in each test file."""
import json
import os
import time
from pathlib import Path

import requests

REPORTS_DIR = Path(__file__).resolve().parent.parent / "reports"
API_CALL_LOG = REPORTS_DIR / "api-call-log.json"


def _append_call_log(entry):
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    existing = []
    if API_CALL_LOG.exists():
        try:
            existing = json.loads(API_CALL_LOG.read_text())
        except json.JSONDecodeError:
            existing = []
    existing.append(entry)
    API_CALL_LOG.write_text(json.dumps(existing, indent=2, default=str))


class ApiClient:
    def __init__(self, base_url):
        self.base_url = base_url.rstrip("/")

    def _call(self, name, method, path, **kwargs):
        url = f"{self.base_url}{path}"
        start = time.perf_counter()
        response = requests.request(method, url, **kwargs)
        duration_ms = round((time.perf_counter() - start) * 1000, 1)

        try:
            response_body = response.json()
        except ValueError:
            response_body = response.text[:500]

        _append_call_log({
            "name": name,
            "request": {"method": method, "url": url, **{k: v for k, v in kwargs.items() if k != "files"}},
            "response": response_body,
            "statusCode": response.status_code,
            "durationMs": duration_ms,
        })
        return response

    def get_health(self):
        return self._call("GET /health", "GET", "/health")

    def predict(self, file_path, threshold=0.85, content_type="image/png"):
        with open(file_path, "rb") as fh:
            files = {"file": (os.path.basename(file_path), fh.read(), content_type)}
        return self._call(
            "POST /predict",
            "POST",
            "/predict",
            files=files,
            data={"threshold": str(threshold)},
        )
