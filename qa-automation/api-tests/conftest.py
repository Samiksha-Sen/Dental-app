import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from utilities.api_client import ApiClient  # noqa: E402


def pytest_addoption(parser):
    parser.addini("backend_url", default="http://localhost:5000", help="Flask backend base URL")


@pytest.fixture(scope="session")
def backend_url():
    import os

    return os.environ.get("BACKEND_URL", "http://localhost:5000")


@pytest.fixture(scope="session")
def api_client(backend_url):
    return ApiClient(backend_url)


@pytest.fixture(scope="session")
def positive_xray_path():
    """A real dental X-ray already in the repo, used instead of a synthetic
    fixture so the /predict happy-path test exercises the actual model."""
    positive_dir = Path(__file__).resolve().parent.parent.parent / "positive_xrays"
    candidates = sorted(p for p in positive_dir.glob("*") if p.suffix.lower() in {".png", ".jpg", ".jpeg"})
    if not candidates:
        pytest.skip(f"No sample X-ray images found in {positive_dir}")
    return candidates[0]
