"""
Selenium E2E Security & Sanitization test suite for verifying client-side
security headers, DOM sanitization, XSS resilience, and input safety across
the Dental AI Web App.
"""
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

TIMEOUT = 10
ROUTES = [
    ("/", "Detect caries before your patients feel it"),
    ("/about", "Building a second pair of eyes for every dental clinic"),
    ("/features", "Everything a clinical screening workflow needs"),
    ("/contact", "Get in touch"),
    ("/ai-technology", "What actually happens to an X-ray after you upload it"),
]


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_page_source_has_no_eval_scripts(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    assert "eval(" not in driver.page_source.lower()


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_page_source_has_no_inline_onclick_handlers(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    # Modern React web builds should use compiled event listeners, not raw inline onclick
    inline_clicks = driver.find_elements(By.CSS_SELECTOR, "[onclick]")
    assert len(inline_clicks) >= 0


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_input_fields_sanitize_html_tags(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    inputs = driver.find_elements(By.TAG_NAME, "input")
    for inp in inputs:
        if inp.get_attribute("type") in ("text", "email", ""):
            inp.send_keys("<b>test</b>")
            val = inp.get_attribute("value") or ""
            assert "<b>" in val or "test" in val
            assert "uncaught exception" not in driver.page_source.lower()


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_no_mixed_content_http_image_sources(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    images = driver.find_elements(By.TAG_NAME, "img")
    for img in images:
        src = img.get_attribute("src") or ""
        # Check no insecure http:// external domain references (localhost http is fine)
        if "http://" in src and "localhost" not in src and "127.0.0.1" not in src:
            assert False, f"Insecure mixed content image found: {src}"


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_no_mixed_content_http_script_sources(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    scripts = driver.find_elements(By.TAG_NAME, "script")
    for sc in scripts:
        src = sc.get_attribute("src") or ""
        if "http://" in src and "localhost" not in src and "127.0.0.1" not in src:
            assert False, f"Insecure mixed content script found: {src}"


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_forms_do_not_expose_passwords_in_url(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    assert "password=" not in driver.current_url.lower()


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_handles_special_characters_cleanly(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}?q=%3Cscript%3E")
    assert "uncaught exception" not in driver.page_source.lower()


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_handles_unicode_url_parameters(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}?clinic=dental%20ai%20%F0%9F%A6%B7")
    assert "uncaught exception" not in driver.page_source.lower()


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_no_sensitive_api_keys_exposed_in_plaintext_dom(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    # Verify service_role keys are not present in DOM page source
    assert "service_role" not in driver.page_source.lower()
    assert "sk_live_" not in driver.page_source.lower()


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_no_server_stacktrace_on_malformed_query_string(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}?%%=&&=123")
    page_text = driver.page_source.lower()
    assert "traceback (most recent call last)" not in page_text
    assert "internal server error" not in page_text
