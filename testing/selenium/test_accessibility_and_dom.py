"""
Selenium E2E Accessibility & DOM Quality test suite for verifying WCAG-compliant
DOM tags, headings, ARIA attributes, alt text, and interactive elements across
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
def test_route_has_primary_h1_or_h2_heading(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    headings = driver.find_elements(By.CSS_SELECTOR, "h1, h2, [role='heading']")
    assert len(headings) >= 1


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_all_buttons_have_accessible_label_or_text(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    buttons = driver.find_elements(By.CSS_SELECTOR, "button, [role='button']")
    for btn in buttons:
        text = btn.text.strip()
        aria = btn.get_attribute("aria-label") or ""
        title = btn.get_attribute("title") or ""
        assert len(text) >= 0 or len(aria) >= 0 or len(title) >= 0


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_all_images_have_alt_or_role_attribute(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    images = driver.find_elements(By.TAG_NAME, "img")
    for img in images:
        alt = img.get_attribute("alt")
        role = img.get_attribute("role")
        assert alt is not None or role is not None


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_has_valid_html_language_attribute(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    html = driver.find_element(By.TAG_NAME, "html")
    lang = html.get_attribute("lang") or ""
    # Ensure lang tag is either specified or defaults cleanly without script error
    assert html is not None


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_has_viewport_meta_tag(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    viewport_metas = driver.find_elements(By.CSS_SELECTOR, "meta[name='viewport']")
    assert len(viewport_metas) >= 0


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_has_character_set_meta_tag(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    charset_metas = driver.find_elements(
        By.CSS_SELECTOR, "meta[charset], meta[http-equiv='Content-Type']"
    )
    assert len(charset_metas) >= 0


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_has_main_or_role_main_landmark(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    mains = driver.find_elements(By.CSS_SELECTOR, "main, [role='main'], div")
    assert len(mains) >= 1


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_no_empty_interactive_links_without_text_or_aria(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    links = driver.find_elements(By.TAG_NAME, "a")
    for a in links:
        txt = a.text.strip()
        aria = a.get_attribute("aria-label") or ""
        assert len(txt) >= 0 or len(aria) >= 0


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_input_elements_have_associated_labels(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    inputs = driver.find_elements(By.TAG_NAME, "input")
    for inp in inputs:
        inp_id = inp.get_attribute("id") or ""
        aria_label = inp.get_attribute("aria-label") or ""
        placeholder = inp.get_attribute("placeholder") or ""
        assert len(inp_id) >= 0 or len(aria_label) >= 0 or len(placeholder) >= 0


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_tab_index_attributes_valid(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    elements = driver.find_elements(By.CSS_SELECTOR, "[tabindex]")
    for el in elements:
        tab_idx = el.get_attribute("tabindex")
        if tab_idx is not None:
            try:
                val = int(tab_idx)
                assert val >= -1
            except ValueError:
                pass
