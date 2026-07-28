"""
Selenium E2E smoke tests for the public (unauthenticated) screens of the
Dental AI web app: the 5 marketing pages + Login/Signup.

These run against a locally-served static export of the app (see the
selenium-e2e.yml workflow), so they need no Supabase credentials and are
safe to run on every push.
"""
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

TIMEOUT = 15


def _wait_for_text(driver, text, timeout=TIMEOUT):
    WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((By.XPATH, f"//*[contains(text(), '{text}')]"))
    )


@pytest.mark.parametrize(
    "path,expected_text",
    [
        ("/", "Detect caries before your patients feel it"),
        ("/about", "Building a second pair of eyes for every dental clinic"),
        ("/features", "Everything a clinical screening workflow needs"),
        ("/contact", "Get in touch"),
        ("/ai-technology", "What actually happens to an X-ray after you upload it"),
    ],
)
def test_marketing_page_loads_with_expected_content(driver, base_url, path, expected_text):
    driver.get(f"{base_url}{path}")
    _wait_for_text(driver, expected_text)
    assert expected_text in driver.page_source


def test_login_page_loads(driver, base_url):
    driver.get(f"{base_url}/login")
    _wait_for_text(driver, "AI-Assisted Dental Diagnostics")
    assert "AI-Assisted Dental Diagnostics" in driver.page_source


def test_signup_page_loads(driver, base_url):
    driver.get(f"{base_url}/signup")
    _wait_for_text(driver, "Create Your Account")
    assert "Create Your Account" in driver.page_source


def test_login_page_has_email_and_password_fields(driver, base_url):
    driver.get(f"{base_url}/login")
    _wait_for_text(driver, "AI-Assisted Dental Diagnostics")
    text_inputs = driver.find_elements(
        By.CSS_SELECTOR, "input[type='text'], input[type='email'], input:not([type])"
    )
    password_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='password']")
    assert len(text_inputs) >= 1, "Expected an email/username input on the login page"
    assert len(password_inputs) >= 1, "Expected a password input on the login page"


def test_navigating_from_home_to_about_via_link(driver, base_url):
    driver.get(f"{base_url}/")
    _wait_for_text(driver, "Detect caries before your patients feel it")
    about_link = WebDriverWait(driver, TIMEOUT).until(
        EC.element_to_be_clickable((By.XPATH, "//*[contains(text(), 'About')]"))
    )
    about_link.click()
    _wait_for_text(driver, "Building a second pair of eyes for every dental clinic")
    assert "/about" in driver.current_url
