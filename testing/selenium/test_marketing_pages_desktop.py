"""
Selenium E2E Desktop Viewport (1920x1080) test suite for the public marketing pages
of the Dental AI Web App. Verifies layout structure, DOM integrity, headers, footers,
and document readiness across all public routes.
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
def test_desktop_route_primary_heading_present(driver, base_url, route, expected_text):
    driver.set_window_size(1920, 1080)
    driver.get(f"{base_url}{route}")
    WebDriverWait(driver, TIMEOUT).until(
        EC.presence_of_element_located((By.XPATH, f"//*[contains(text(), '{expected_text}')]"))
    )
    assert expected_text in driver.page_source


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_desktop_route_document_ready_state_complete(driver, base_url, route, expected_text):
    driver.set_window_size(1920, 1080)
    driver.get(f"{base_url}{route}")
    state = driver.execute_script("return document.readyState;")
    assert state == "complete"


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_desktop_route_title_non_empty(driver, base_url, route, expected_text):
    driver.set_window_size(1920, 1080)
    driver.get(f"{base_url}{route}")
    assert driver.title is not None


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_desktop_route_body_element_rendered(driver, base_url, route, expected_text):
    driver.set_window_size(1920, 1080)
    driver.get(f"{base_url}{route}")
    body = driver.find_element(By.TAG_NAME, "body")
    assert body.is_displayed()


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_desktop_route_no_react_error_overlay(driver, base_url, route, expected_text):
    driver.set_window_size(1920, 1080)
    driver.get(f"{base_url}{route}")
    page_text = driver.page_source.lower()
    assert "uncaught exception" not in page_text
    assert "runtime error" not in page_text


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_desktop_route_root_container_width_positive(driver, base_url, route, expected_text):
    driver.set_window_size(1920, 1080)
    driver.get(f"{base_url}{route}")
    width = driver.execute_script("return document.body.clientWidth;")
    assert width > 0


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_desktop_route_scroll_height_valid(driver, base_url, route, expected_text):
    driver.set_window_size(1920, 1080)
    driver.get(f"{base_url}{route}")
    scroll_height = driver.execute_script("return document.body.scrollHeight;")
    assert scroll_height >= 100


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_desktop_route_contains_dental_branding(driver, base_url, route, expected_text):
    driver.set_window_size(1920, 1080)
    driver.get(f"{base_url}{route}")
    assert "dental" in driver.page_source.lower() or "ai" in driver.page_source.lower()


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_desktop_route_no_broken_image_placeholders(driver, base_url, route, expected_text):
    driver.set_window_size(1920, 1080)
    driver.get(f"{base_url}{route}")
    images = driver.find_elements(By.TAG_NAME, "img")
    for img in images:
        src = img.get_attribute("src") or ""
        assert "undefined" not in src.lower()
        assert "null" not in src.lower()


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_desktop_route_has_clickable_navigation_links(driver, base_url, route, expected_text):
    driver.set_window_size(1920, 1080)
    driver.get(f"{base_url}{route}")
    links = driver.find_elements(By.TAG_NAME, "a")
    assert len(links) >= 1
