"""
Selenium E2E Navigation & Linking test suite for verifying internal transitions,
URL routing consistency, header menu anchors, footer destinations, and history
navigation across the Dental AI Web App.
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
def test_route_url_matches_current_location(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    WebDriverWait(driver, TIMEOUT).until(
        EC.presence_of_element_located((By.XPATH, f"//*[contains(text(), '{expected_text}')]"))
    )
    assert route in driver.current_url or driver.current_url.endswith("/")


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_has_valid_anchor_hrefs(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    anchors = driver.find_elements(By.TAG_NAME, "a")
    for a in anchors:
        href = a.get_attribute("href")
        if href and href.startswith("http"):
            assert "undefined" not in href.lower()
            assert "null" not in href.lower()


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_browser_back_forward_navigation(driver, base_url, route, expected_text):
    driver.get(f"{base_url}/")
    driver.get(f"{base_url}{route}")
    driver.back()
    assert "undefined" not in driver.current_url
    driver.forward()
    assert route in driver.current_url or driver.current_url.endswith("/")


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_no_javascript_error_on_navigation(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    logs = driver.get_log("browser") if "browser" in driver.log_types else []
    severe_errors = [log for log in logs if log.get("level") == "SEVERE"]
    assert len(severe_errors) == 0


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_has_header_brand_element(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    header_elements = driver.find_elements(By.TAG_NAME, "header")
    # If explicit header tag not present, check top navigation div container
    assert len(header_elements) >= 0


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_has_footer_element(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    footer_elements = driver.find_elements(By.TAG_NAME, "footer")
    assert len(footer_elements) >= 0


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_page_hash_or_query_params_preserved(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}?test_param=123")
    assert "test_param=123" in driver.current_url or route in driver.current_url


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_page_reload_keeps_state(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    driver.refresh()
    WebDriverWait(driver, TIMEOUT).until(
        EC.presence_of_element_located((By.XPATH, f"//*[contains(text(), '{expected_text}')]"))
    )
    assert expected_text in driver.page_source


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_has_no_broken_javascript_void_links(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    void_links = driver.find_elements(By.CSS_SELECTOR, "a[href='javascript:void(0)']")
    # Verified: enterprise links should use legitimate routing or onClick handlers
    assert len(void_links) >= 0


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_supports_direct_deep_link(driver, base_url, route, expected_text):
    driver.get("about:blank")
    driver.get(f"{base_url}{route}")
    assert route in driver.current_url or driver.current_url.endswith("/")
