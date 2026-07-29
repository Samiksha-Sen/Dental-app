"""Locust load test for the Flask AI backend (app.py). Two user classes
matching the two real traffic shapes the backend actually sees:

- HealthCheckUser: frequent, cheap polling (the RN app doesn't call
  /health today, but any uptime monitor or load balancer would) — high
  weight, near-zero server-side cost, useful for isolating "is the process
  itself responsive" from "is the model inference path responsive".
- PredictUser: the real workload — a multipart image upload through two
  on-CPU TensorFlow model passes (xray_validator.h5 then caries_model1.h5),
  the only genuinely expensive endpoint in this app.

Run locally: `locust -f locustfile.py --host http://localhost:5000`
Run headless (what CI does): see ../../.github/workflows/load-testing.yml
"""
import os
import random
from pathlib import Path

from locust import HttpUser, task, between

POSITIVE_XRAYS_DIR = Path(__file__).resolve().parent.parent.parent / "positive_xrays"


def _sample_xray_bytes():
    candidates = [p for p in POSITIVE_XRAYS_DIR.glob("*") if p.suffix.lower() in {".png", ".jpg", ".jpeg"}]
    if not candidates:
        return None
    return random.choice(candidates).read_bytes()


class HealthCheckUser(HttpUser):
    weight = 3
    wait_time = between(1, 3)

    @task
    def check_health(self):
        self.client.get("/health", name="/health")


class PredictUser(HttpUser):
    weight = 1
    wait_time = between(2, 6)

    def on_start(self):
        self.xray_bytes = _sample_xray_bytes()

    @task
    def predict_xray(self):
        if not self.xray_bytes:
            return
        files = {"file": ("loadtest_xray.png", self.xray_bytes, "image/png")}
        with self.client.post(
            "/predict",
            files=files,
            data={"threshold": "0.85"},
            name="/predict",
            catch_response=True,
        ) as response:
            try:
                body = response.json()
            except ValueError:
                response.failure("Non-JSON response")
                return
            if "error" in body:
                # A validation rejection is a legitimate response shape,
                # not a load-test failure — only flag genuine failures.
                response.success()
            elif "condition" not in body:
                response.failure(f"Unexpected response shape: {body}")
