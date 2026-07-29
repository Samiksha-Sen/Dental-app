"""Runs the small, fast subset of the load-test matrix that's safe to
execute on every push (see testdata/expansions/loadTestExpansion.js's
CI_EXECUTED set — kept in sync with SCENARIOS below by hand, since one is
JS catalog metadata and the other is the actual runnable Python driver).

Each scenario is a real `locust --headless` invocation against a live
backend, parsed from its CSV output and checked against the same latency/
error-rate budgets documented in the catalog. Prints one line per
scenario as it runs and one PASS/FAIL line per metric — this is what makes
the GitHub Actions log show the load test "line by line" rather than a
single opaque pass/fail.
"""
import csv
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPORTS_DIR = ROOT / "reports"
BACKEND_URL = os.environ.get("BACKEND_URL", "http://127.0.0.1:5000")

# Mirrors testdata/expansions/loadTestExpansion.js's CI_EXECUTED set.
# `user_class` pins which locustfile.py User class runs — without it,
# Locust picks classes by weight (HealthCheckUser:PredictUser = 3:1), so a
# small `-u N` could spawn zero of the class the scenario is meant to test.
SCENARIOS = [
    {"id": "TC_LOAD_health_1u", "endpoint": "/health", "user_class": "HealthCheckUser", "users": 1, "spawn_rate": 1, "duration": 30, "budgets": {"p95_ms": 500, "error_rate_pct": 1}},
    {"id": "TC_LOAD_health_10u", "endpoint": "/health", "user_class": "HealthCheckUser", "users": 10, "spawn_rate": 5, "duration": 30, "budgets": {"p95_ms": 500, "error_rate_pct": 1}},
    {"id": "TC_LOAD_health_50u", "endpoint": "/health", "user_class": "HealthCheckUser", "users": 50, "spawn_rate": 10, "duration": 30, "budgets": {"p95_ms": 500, "error_rate_pct": 1}},
    {"id": "TC_LOAD_predict_1u", "endpoint": "/predict", "user_class": "PredictUser", "users": 1, "spawn_rate": 1, "duration": 30, "budgets": {"p95_ms": 10000, "error_rate_pct": 1}},
    {"id": "TC_LOAD_predict_5u", "endpoint": "/predict", "user_class": "PredictUser", "users": 5, "spawn_rate": 2, "duration": 30, "budgets": {"p95_ms": 15000, "error_rate_pct": 1}},
    {"id": "TC_LOAD_predict_10u", "endpoint": "/predict", "user_class": "PredictUser", "users": 10, "spawn_rate": 5, "duration": 30, "budgets": {"p95_ms": 20000, "error_rate_pct": 1}},
]


def run_scenario(scenario):
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    csv_prefix = REPORTS_DIR / scenario["id"]
    print(f"\n=== Running {scenario['id']}: {scenario['endpoint']} @ {scenario['users']} users for {scenario['duration']}s ===")

    cmd = [
        "locust", "-f", str(ROOT / "locustfile.py"), scenario["user_class"],
        "--host", BACKEND_URL,
        "--headless",
        "-u", str(scenario["users"]),
        "-r", str(scenario["spawn_rate"]),
        "-t", f"{scenario['duration']}s",
        "--csv", str(csv_prefix),
        "--only-summary",
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    print(result.stdout[-2000:])
    if result.returncode not in (0, 1):  # locust returns 1 when failure ratio thresholds set via --exit-code-on-error are hit
        print(result.stderr[-2000:])

    stats_file = Path(f"{csv_prefix}_stats.csv")
    if not stats_file.exists():
        return {"id": scenario["id"], "status": "Blocked", "reason": "locust did not produce a stats CSV"}

    with open(stats_file, newline="", encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))

    row = next((r for r in rows if r.get("Name") == scenario["endpoint"]), None) or next((r for r in rows if r.get("Type") == "Aggregated"), None)
    if row is None:
        return {"id": scenario["id"], "status": "Blocked", "reason": f"no stats row found for {scenario['endpoint']}"}

    try:
        p95 = float(row.get("95%", row.get("95%ile", 0)) or 0)
        request_count = int(row.get("Request Count", 0) or 0)
        failure_count = int(row.get("Failure Count", 0) or 0)
    except (TypeError, ValueError) as exc:
        return {"id": scenario["id"], "status": "Blocked", "reason": f"could not parse stats row: {exc}"}

    error_rate_pct = (failure_count / request_count * 100) if request_count else 0
    p95_ok = p95 <= scenario["budgets"]["p95_ms"]
    error_ok = error_rate_pct <= scenario["budgets"]["error_rate_pct"]

    print(f"  p95={p95}ms (budget {scenario['budgets']['p95_ms']}ms) -> {'PASS' if p95_ok else 'FAIL'}")
    print(f"  error_rate={error_rate_pct:.2f}% (budget {scenario['budgets']['error_rate_pct']}%) -> {'PASS' if error_ok else 'FAIL'}")

    return {
        "id": scenario["id"],
        "status": "Passed" if (p95_ok and error_ok) else "Failed",
        "p95Ms": p95,
        "errorRatePct": round(error_rate_pct, 2),
        "requestCount": request_count,
        "failureCount": failure_count,
    }


def main():
    results = [run_scenario(s) for s in SCENARIOS]

    summary_path = REPORTS_DIR / "load-test-summary.json"
    summary_path.write_text(json.dumps(results, indent=2))

    print("\n=== Load test summary ===")
    for r in results:
        print(f"  {r['id']}: {r['status']}" + (f" ({r.get('reason')})" if r.get("reason") else ""))

    if any(r["status"] in ("Failed", "Blocked") for r in results):
        sys.exit(1)


if __name__ == "__main__":
    main()
