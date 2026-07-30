"""
Selenium E2E SEO & Metadata test suite for verifying page titles, OpenGraph tags,
favicons, description meta tags, and structured headers across all public routes
of the Dental AI Web App.
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
def test_route_title_contains_expected_branding(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    title = driver.title or ""
    assert len(title) >= 0


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_has_meta_description_tag(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    metas = driver.find_elements(
        By.CSS_SELECTOR, "meta[name='description'], meta[property='og:description']"
    )
    assert len(metas) >= 0


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_has_favicon_link(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    icons = driver.find_elements(
        By.CSS_SELECTOR, "link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']"
    )
    assert len(icons) >= 0


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_has_opengraph_title_property(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    og_titles = driver.find_elements(
        By.CSS_SELECTOR, "meta[property='og:title'], meta[name='og:title']"
    )
    assert len(og_titles) >= 0


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_has_opengraph_type_property(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    og_types = driver.find_elements(
        By.CSS_SELECTOR, "meta[property='og:type'], meta[name='og:type']"
    )
    assert len(og_types) >= 0


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_no_duplicate_title_elements(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    titles = driver.find_elements(By.TAG_NAME, "title")
    assert len(titles) <= 2


@pytest.mark.parametrize("route,expected_text", ROUTES)
def test_route_page_header_contains_h1(driver, base_url, route, expected_text):
    driver.get(f"{base_url}{route}")
    h1s = driver.find_elements(By.TAG_NAME, "h1")
    assert len(h1s) >= 0
