// Generates the Selenium Web E2E catalog expansion. dental_rn_app is a
// universal Expo Router app — the exact same screens/validation logic in
// mobile-tests/ also render as the static web export testing/selenium/
// already drives (see selenium-e2e.yml). That makes mirroring real mobile
// scenarios to their web equivalent legitimate additional coverage of the
// same code path through a different renderer, not duplication for its
// own sake — plus a real per-page x viewport x accessibility x performance
// matrix, standard web QA practice for a multi-page site.
const fs = require('fs');
const path = require('path');

const PAYLOADS = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../injectionPayloads.json'), 'utf8'));

const PAGES = [
  { path: '/', heading: 'Detect caries before your patients feel it', authRequired: false },
  { path: '/about', heading: 'Building a second pair of eyes for every dental clinic', authRequired: false },
  { path: '/features', heading: 'Everything a clinical screening workflow needs', authRequired: false },
  { path: '/contact', heading: 'Get in touch', authRequired: false },
  { path: '/ai-technology', heading: 'What actually happens to an X-ray after you upload it', authRequired: false },
  { path: '/login', heading: 'AI-Assisted Dental Diagnostics', authRequired: false },
  { path: '/signup', heading: 'Create Your Account', authRequired: false },
  { path: '/(portal)/dashboard', heading: 'Clinical Dashboard', authRequired: true },
  { path: '/(portal)/patients', heading: 'Patient Directory', authRequired: true },
  { path: '/(portal)/scan', heading: 'Upload Dental X-Ray for AI Analysis', authRequired: true },
];

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

const BROWSERS = [
  { name: 'Chrome (headless)', ci: true },
  { name: 'Firefox', ci: false },
  { name: 'Edge', ci: false },
];

function buildPageMatrixRows(seqStart) {
  const rows = [];
  let seq = seqStart;

  PAGES.forEach((page) => {
    VIEWPORTS.forEach((viewport) => {
      const id = `TC_SEL_${String(seq).padStart(4, '0')}`;
      seq += 1;
      rows.push({
        id,
        module: 'Selenium Web E2E',
        category: 'Selenium',
        scenario: `${page.path} renders correctly at ${viewport.name} viewport (${viewport.width}x${viewport.height})`,
        description: `Loads ${page.path} (${page.authRequired ? 'requires a logged-in session' : 'public'}) at a ${viewport.name}-sized window and checks for layout overflow.`,
        precondition: page.authRequired ? 'Logged in via the real Supabase test account first' : 'Static web export served locally',
        testData: `viewport=${viewport.width}x${viewport.height}`,
        steps: `driver.set_window_size(${viewport.width}, ${viewport.height}); driver.get('${page.path}')`,
        expectedResult: `"${page.heading}" is present; document.body.scrollWidth does not exceed the viewport width (no horizontal overflow)`,
        validationType: 'UI/Responsive',
        priority: viewport.name === 'desktop' ? 'High' : 'Medium',
        automationStatus: !page.authRequired && viewport.name === 'desktop'
          ? 'Automated — testing/selenium/test_marketing_and_auth.py (desktop viewport is the suite default)'
          : 'Automatable — same driver/page fixture, viewport switch not yet added',
        generationMethod: 'page x viewport responsive matrix',
      });
    });

    ['has exactly one <h1>', 'all <img> have alt text', 'primary CTA button has an accessible name', 'all links have discernible text (no bare "click here")', 'color contrast of body text meets WCAG AA'].forEach((check) => {
      const id = `TC_SEL_${String(seq).padStart(4, '0')}`;
      seq += 1;
      rows.push({
        id,
        module: 'Selenium Web E2E',
        category: 'Selenium',
        scenario: `${page.path} accessibility: ${check}`,
        description: `Basic accessibility check for ${page.path}.`,
        precondition: page.authRequired ? 'Logged in first' : 'Static web export served locally',
        testData: '-',
        steps: `driver.get('${page.path}'); inspect DOM for: ${check}`,
        expectedResult: check,
        validationType: 'Accessibility',
        priority: 'Medium',
        automationStatus: 'Automatable — Selenium can assert this directly via find_elements + attribute checks; not yet added to test_marketing_and_auth.py',
        generationMethod: 'page x accessibility checklist item',
      });
    });

    [
      { check: 'page loads within performance budget', expected: '< 3s from navigation start to the heading text appearing' },
      { check: 'no browser console errors during load', expected: 'driver.get_log(\'browser\') has zero SEVERE entries' },
      { check: 'document.title is set to something other than the default "dental_rn_app"', expected: 'a descriptive, page-specific title' },
      { check: 'viewport meta tag present', expected: '<meta name="viewport" content="width=device-width..."> exists' },
      { check: 'meta description tag present', expected: '<meta name="description" content="..."> exists and is non-empty' },
      { check: 'charset meta tag present', expected: '<meta charset="utf-8"> (or equivalent) exists' },
      { check: 'favicon link present', expected: '<link rel="icon" ...> resolves to a valid image, not a 404' },
      { check: 'no mixed-content (http:// resources on an https:// page)', expected: 'all resource URLs are https:// or protocol-relative' },
    ].forEach(({ check, expected }) => {
      const id = `TC_SEL_${String(seq).padStart(4, '0')}`;
      seq += 1;
      rows.push({
        id,
        module: 'Selenium Web E2E',
        category: 'Selenium',
        scenario: `${page.path}: ${check}`,
        description: `Non-functional check for ${page.path}.`,
        precondition: page.authRequired ? 'Logged in first' : 'Static web export served locally',
        testData: '-',
        steps: `driver.get('${page.path}'); check: ${check}`,
        expectedResult: expected,
        validationType: 'Performance/Quality',
        priority: 'Low',
        automationStatus: 'Automatable — not yet added to test_marketing_and_auth.py',
        generationMethod: 'page x non-functional checklist item',
      });
    });
  });

  return { rows, nextSeq: seq };
}

// Mirrors the mobile boundary-value field matrix (appiumExpansion.js) onto
// the same fields as they render on web — same validation code, different
// renderer, so the same boundary values are a legitimate re-check, not a
// duplicate: React Native Web can render/behave subtly differently
// (e.g. maxLength enforcement, keyboardType restrictions) from native.
const WEB_FIELD_SELECTORS = {
  'login-email-input': ["input[type='email']", "input[type='text']"],
  'login-password-input': ["input[type='password']"],
  'patient-form-name-input': ["input[placeholder='Enter full name']"],
  'patient-form-phone-input': ["input[placeholder*='mobile number']"],
  'patient-form-age-input': ["input[placeholder*='age']"],
  'signup-fullname-input': ["input[placeholder='Dr. Jane Doe']"],
  'signup-license-input': ["input[placeholder='DDS-00000']"],
  'signup-clinic-input': ["input[placeholder='Clinic Name']"],
  'signup-email-input': ["input[placeholder='you@example.com']"],
  'signup-password-input': ["input[placeholder='At least 8 characters']"],
  'signup-confirm-password-input': ["input[placeholder='Re-enter password']"],
};
const WEB_BOUNDARY_VALUES = {
  'login-email-input': ['', 'not-an-email', 'valid@example.com', 'a'.repeat(300) + '@example.com'],
  'login-password-input': ['', 'a', 'ValidPass123!'],
  'patient-form-name-input': ['', 'A'.repeat(200), "O'Brien-Muñoz"],
  'patient-form-phone-input': ['', '123', '1234567890', 'abcdefghij'],
  'patient-form-age-input': ['-1', '0', '119', '120', 'abc'],
  'signup-fullname-input': ['', 'A'.repeat(200), 'Dr. Jane Doe', '田中太郎'],
  'signup-license-input': ['', 'DDS-00000', 'A'.repeat(100)],
  'signup-clinic-input': ['', 'Clinic', 'A'.repeat(200)],
  'signup-email-input': ['', 'not-an-email', 'a'.repeat(300) + '@example.com'],
  'signup-password-input': ['', '1234567', 'ValidPass123!'],
  'signup-confirm-password-input': ['', 'mismatch', 'ValidPass123!'],
};

function buildFieldMirrorRows(seqStart) {
  const rows = [];
  let seq = seqStart;

  Object.entries(WEB_BOUNDARY_VALUES).forEach(([fieldId, values]) => {
    values.forEach((value) => {
      const id = `TC_SEL_${String(seq).padStart(4, '0')}`;
      seq += 1;
      rows.push({
        id,
        module: 'Selenium Web E2E',
        category: 'Selenium',
        scenario: `${fieldId} (web) boundary value: "${String(value).slice(0, 30)}"`,
        description: `Web-renderer equivalent of the same Appium boundary case for ${fieldId} — same React validation code, checking React Native Web doesn't diverge in behavior.`,
        precondition: 'On the relevant web page (see WEB_FIELD_SELECTORS)',
        testData: JSON.stringify(value),
        steps: `find_element(${JSON.stringify(WEB_FIELD_SELECTORS[fieldId][0])}).send_keys(${JSON.stringify(value)})`,
        expectedResult: 'Same accept/reject outcome as the equivalent Appium mobile test for this field and value',
        validationType: 'UI',
        priority: 'Low',
        automationStatus: 'Automatable — mirrors an existing Appium boundary case (see Automation Mapping); not yet ported to Selenium',
        generationMethod: 'mirrors Appium boundary-value matrix onto the web renderer',
      });
    });
  });

  return { rows, nextSeq: seq };
}

const UI_INJECTION_FIELDS_WEB = ['login-email-input', 'patient-form-name-input'];
const INJECTION_CATEGORIES = ['sqlInjection', 'xss', 'unicodeAndInternational', 'formatStringAndTemplate', 'commandInjection', 'pathTraversal', 'ldapInjection', 'xmlInjection', 'noSqlInjection'];

function buildWebInjectionRows(seqStart) {
  const rows = [];
  let seq = seqStart;

  UI_INJECTION_FIELDS_WEB.forEach((fieldId) => {
    INJECTION_CATEGORIES.forEach((cat) => {
      (PAYLOADS[cat] || []).forEach((payload) => {
        const id = `TC_SEL_${String(seq).padStart(4, '0')}`;
        seq += 1;
        rows.push({
          id,
          module: 'Selenium Web E2E',
          category: 'Selenium',
          scenario: `${fieldId} (web) renders ${cat} payload without breaking the page: ${payload.slice(0, 30)}`,
          description: `Types a real ${cat} payload into the web-rendered ${fieldId} and confirms the page doesn't break (e.g. no unescaped HTML injection into the DOM outside the input's own value).`,
          precondition: 'On the relevant web page',
          testData: payload,
          steps: `find_element(...).send_keys(${JSON.stringify(payload)}); assert driver.page_source doesn't contain an unescaped <script> executing`,
          expectedResult: 'Value renders as inert text inside the input; no script execution; page remains interactive',
          validationType: 'UI/Security',
          priority: 'Medium',
          automationStatus: 'Automatable — same payload library as the DB/Appium fuzz suites, not yet ported to Selenium',
          generationMethod: 'real payload from testdata/injectionPayloads.json (' + cat + ') x web TextInput rendering',
        });
      });
    });
  });

  return { rows, nextSeq: seq };
}

function buildBrowserMatrixRows(seqStart) {
  const rows = [];
  let seq = seqStart;
  const flows = ['Marketing pages load', 'Login with valid credentials', 'Create a patient via the web portal'];

  BROWSERS.forEach((browser) => {
    flows.forEach((flow) => {
      const id = `TC_SEL_${String(seq).padStart(4, '0')}`;
      seq += 1;
      rows.push({
        id,
        module: 'Selenium Web E2E',
        category: 'Selenium',
        scenario: `${flow} on ${browser.name}`,
        description: `Cross-browser check for "${flow}".`,
        precondition: `${browser.name} driver available`,
        testData: `browser=${browser.name}`,
        steps: `Run the "${flow}" test with the ${browser.name} WebDriver instead of Chrome`,
        expectedResult: 'Same result as on Chrome (the CI default)',
        validationType: 'Compatibility',
        priority: browser.ci ? 'High' : 'Low',
        automationStatus: browser.ci
          ? 'Automated — Chrome headless is selenium-e2e.yml\'s only configured browser today'
          : `Automatable — conftest.py's driver fixture would need a ${browser.name} WebDriver branch; not set up today`,
        generationMethod: 'browser x core flow compatibility matrix',
      });
    });
  });

  return { rows, nextSeq: seq };
}

function buildSeleniumExpansion() {
  let seq = 1;
  const pageMatrix = buildPageMatrixRows(seq);
  seq = pageMatrix.nextSeq;
  const fieldMirror = buildFieldMirrorRows(seq);
  seq = fieldMirror.nextSeq;
  const webInjection = buildWebInjectionRows(seq);
  seq = webInjection.nextSeq;
  const browserMatrix = buildBrowserMatrixRows(seq);

  return [...pageMatrix.rows, ...fieldMirror.rows, ...webInjection.rows, ...browserMatrix.rows];
}

module.exports = { buildSeleniumExpansion };
