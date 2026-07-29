import pytest


@pytest.mark.smoke
def test_health_returns_ok_status(api_client):
    response = api_client.get_health()
    assert response.status_code == 200

    body = response.json()
    assert body["status"] == "ok"


@pytest.mark.smoke
def test_health_reports_models_loaded(api_client):
    # app.py loads caries_model1.h5 and xray_validator.h5 at process start;
    # models_loaded should be True once the server has finished booting.
    response = api_client.get_health()
    body = response.json()
    assert body["models_loaded"] is True


def test_health_response_time_is_reasonable(api_client):
    response = api_client.get_health()
    assert response.elapsed.total_seconds() < 2.0, "/health should not be doing model inference work"
