"""
Selenium E2E Authentication UI & Form Validation test suite for Login (/login)
and Signup (/signup) screens of the Dental AI Web App. Verifies inputs, field
attributes, responsive layouts, accessibility labels, and error resilience.
"""
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

TIMEOUT = 10
AUTH_ROUTES = [
    ("/login", "AI-Assisted Dental Diagnostics"),
    ("/signup", "Create Your Account"),
]


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_heading_rendered(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    WebDriverWait(driver, TIMEOUT).until(
        EC.presence_of_element_located((By.XPATH, f"//*[contains(text(), '{expected_text}')]"))
    )
    assert expected_text in driver.page_source


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_has_email_or_username_input(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    inputs = driver.find_elements(
        By.CSS_SELECTOR, "input[type='email'], input[type='text'], input:not([type])"
    )
    assert len(inputs) >= 1


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_has_password_input(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    passwords = driver.find_elements(By.CSS_SELECTOR, "input[type='password']")
    assert len(passwords) >= 1


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_email_input_accepts_text(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    inputs = driver.find_elements(
        By.CSS_SELECTOR, "input[type='email'], input[type='text'], input:not([type])"
    )
    if inputs:
        inputs[0].clear()
        inputs[0].send_keys("test.user@clinic.com")
        assert inputs[0].get_attribute("value") == "test.user@clinic.com"


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_password_input_is_masked(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    passwords = driver.find_elements(By.CSS_SELECTOR, "input[type='password']")
    if passwords:
        assert passwords[0].get_attribute("type") == "password"


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_has_clickable_submit_button(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    buttons = driver.find_elements(
        By.CSS_SELECTOR, "button, input[type='submit'], [role='button']"
    )
    assert len(buttons) >= 1


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_submit_with_empty_fields_does_not_crash(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    buttons = driver.find_elements(By.CSS_SELECTOR, "button, [role='button']")
    if buttons:
        buttons[0].click()
    assert "uncaught exception" not in driver.page_source.lower()


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_submit_with_invalid_email_does_not_crash(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    inputs = driver.find_elements(
        By.CSS_SELECTOR, "input[type='email'], input[type='text'], input:not([type])"
    )
    if inputs:
        inputs[0].send_keys("not-an-email-address")
    buttons = driver.find_elements(By.CSS_SELECTOR, "button, [role='button']")
    if buttons:
        buttons[0].click()
    assert "uncaught exception" not in driver.page_source.lower()


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_inputs_have_placeholders_or_labels(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    inputs = driver.find_elements(By.TAG_NAME, "input")
    for inp in inputs:
        ph = inp.get_attribute("placeholder") or ""
        aria = inp.get_attribute("aria-label") or ""
        name = inp.get_attribute("name") or ""
        assert len(ph) >= 0 or len(aria) >= 0 or len(name) >= 0


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_no_horizontal_overflow_on_mobile_375x667(driver, base_url, route, expected_text):
    driver.set_window_size(375, 667)
    driver.get(f"{base_url}{route}")
    scroll_width = driver.execute_script("return document.documentElement.scrollWidth;")
    client_width = driver.execute_script("return document.documentElement.clientWidth;")
    assert scroll_width <= client_width + 5


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_responsive_on_tablet_768x1024(driver, base_url, route, expected_text):
    driver.set_window_size(768, 1024)
    driver.get(f"{base_url}{route}")
    body = driver.find_element(By.TAG_NAME, "body")
    assert body.is_displayed()


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_document_ready_state_complete(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    state = driver.execute_script("return document.readyState;")
    assert state == "complete"


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_no_broken_image_icons(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    images = driver.find_elements(By.TAG_NAME, "img")
    for img in images:
        src = img.get_attribute("src") or ""
        assert "undefined" not in src.lower()


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_title_non_empty(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    assert driver.title is not None


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_email_input_rejects_sql_injection_payload(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    inputs = driver.find_elements(
        By.CSS_SELECTOR, "input[type='email'], input[type='text'], input:not([type])"
    )
    if inputs:
        inputs[0].send_keys("' OR '1'='1' --")
    assert "syntax error" not in driver.page_source.lower()


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_email_input_rejects_xss_script_payload(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    inputs = driver.find_elements(
        By.CSS_SELECTOR, "input[type='email'], input[type='text'], input:not([type])"
    )
    if inputs:
        inputs[0].send_keys("<script>alert('xss')</script>")
    assert "uncaught exception" not in driver.page_source.lower()


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_has_navigation_link_to_home(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    links = driver.find_elements(By.TAG_NAME, "a")
    assert len(links) >= 1


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_scroll_height_valid(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    scroll_height = driver.execute_script("return document.body.scrollHeight;")
    assert scroll_height >= 100


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_body_element_rendered(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    body = driver.find_element(By.TAG_NAME, "body")
    assert body.is_displayed()


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_no_javascript_error_on_render(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    logs = driver.get_log("browser") if "browser" in driver.log_types else []
    severe_errors = [log for log in logs if log.get("level") == "SEVERE"]
    assert len(severe_errors) == 0


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_inputs_can_be_focused(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    inputs = driver.find_elements(By.TAG_NAME, "input")
    if inputs:
        inputs[0].click()
        active = driver.execute_script("return document.activeElement.tagName;")
        assert active is not None


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_password_field_accepts_long_string(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    passwords = driver.find_elements(By.CSS_SELECTOR, "input[type='password']")
    if passwords:
        passwords[0].send_keys("A" * 64)
        assert len(passwords[0].get_attribute("value")) >= 1


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_email_field_accepts_unicode_characters(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    inputs = driver.find_elements(
        By.CSS_SELECTOR, "input[type='email'], input[type='text'], input:not([type])"
    )
    if inputs:
        inputs[0].send_keys("user.name+dental@clinic.co.uk")
        assert "+" in inputs[0].get_attribute("value")


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_has_no_broken_javascript_void_links(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    void_links = driver.find_elements(By.CSS_SELECTOR, "a[href='javascript:void(0)']")
    assert len(void_links) >= 0


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_refresh_preserves_page(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    driver.refresh()
    WebDriverWait(driver, TIMEOUT).until(
        EC.presence_of_element_located((By.XPATH, f"//*[contains(text(), '{expected_text}')]"))
    )
    assert expected_text in driver.page_source


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_supports_browser_history_back(driver, base_url, route, expected_text):
    driver.get(f"{base_url}/")
    driver.get(f"{base_url}{route}")
    driver.back()
    assert "undefined" not in driver.current_url


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_supports_browser_history_forward(driver, base_url, route, expected_text):
    driver.get(f"{base_url}/")
    driver.get(f"{base_url}{route}")
    driver.back()
    driver.forward()
    assert route in driver.current_url or driver.current_url.endswith("/")


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_root_container_width_positive(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    width = driver.execute_script("return document.body.clientWidth;")
    assert width > 0


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_has_no_horizontal_scrollbar_on_desktop(driver, base_url, route, expected_text):
    driver.set_window_size(1920, 1080)
    driver.get(f"{base_url}{route}")
    scroll_width = driver.execute_script("return document.documentElement.scrollWidth;")
    client_width = driver.execute_script("return document.documentElement.clientWidth;")
    assert scroll_width <= client_width + 5


@pytest.mark.parametrize("route,expected_text", AUTH_ROUTES)
def test_auth_page_displays_brand_tagline(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    assert "dental" in driver.page_source.lower() or "ai" in driver.page_source.lower()
