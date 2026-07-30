"""
Selenium E2E Responsive Viewport test suite for Mobile (375x667) and Tablet (768x1024)
devices across all 5 marketing routes of the Dental AI Web App.
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
def test_mobile_375x667_primary_heading_present(driver, base_url, route, expected_text):
    driver.set_window_size(375, 667)
    driver.get(f"{base_url}{route}")
    WebDriverWait(driver, TIMEOUT).until(
        EC.presence_of_element_located((By.XPATH, f"//*[contains(text(), '{expected_text}')]"))
    )
    assert expected_text in driver.page_source


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_tablet_768x1024_primary_heading_present(driver, base_url, route, expected_text):
    driver.set_window_size(768, 1024)
    driver.get(f"{base_url}{route}")
    WebDriverWait(driver, TIMEOUT).until(
        EC.presence_of_element_located((By.XPATH, f"//*[contains(text(), '{expected_text}')]"))
    )
    assert expected_text in driver.page_source


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_mobile_viewport_no_horizontal_overflow(driver, base_url, route, expected_text):
    driver.set_window_size(375, 667)
    driver.get(f"{base_url}{route}")
    scroll_width = driver.execute_script("return document.documentElement.scrollWidth;")
    client_width = driver.execute_script("return document.documentElement.clientWidth;")
    assert scroll_width <= client_width + 5


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_tablet_viewport_no_horizontal_overflow(driver, base_url, route, expected_text):
    driver.set_window_size(768, 1024)
    driver.get(f"{base_url}{route}")
    scroll_width = driver.execute_script("return document.documentElement.scrollWidth;")
    client_width = driver.execute_script("return document.documentElement.clientWidth;")
    assert scroll_width <= client_width + 5


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_mobile_viewport_body_rendered(driver, base_url, route, expected_text):
    driver.set_window_size(375, 667)
    driver.get(f"{base_url}{route}")
    body = driver.find_element(By.TAG_NAME, "body")
    assert body.is_displayed()


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_tablet_viewport_body_rendered(driver, base_url, route, expected_text):
    driver.set_window_size(768, 1024)
    driver.get(f"{base_url}{route}")
    body = driver.find_element(By.TAG_NAME, "body")
    assert body.is_displayed()


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_mobile_viewport_links_accessible(driver, base_url, route, expected_text):
    driver.set_window_size(375, 667)
    driver.get(f"{base_url}{route}")
    links = driver.find_elements(By.TAG_NAME, "a")
    assert len(links) >= 1


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_tablet_viewport_links_accessible(driver, base_url, route, expected_text):
    driver.set_window_size(768, 1024)
    driver.get(f"{base_url}{route}")
    links = driver.find_elements(By.TAG_NAME, "a")
    assert len(links) >= 1


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_mobile_viewport_ready_state_complete(driver, base_url, route, expected_text):
    driver.set_window_size(375, 667)
    driver.get(f"{base_url}{route}")
    state = driver.execute_script("return document.readyState;")
    assert state == "complete"


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_tablet_viewport_ready_state_complete(driver, base_url, route, expected_text):
    driver.set_window_size(768, 1024)
    driver.get(f"{base_url}{route}")
    state = driver.execute_script("return document.readyState;")
    assert state == "complete"
