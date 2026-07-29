// Generates the Appium Mobile E2E catalog expansion via three real
// combinatorial dimensions — boundary-value analysis, the same real
// injection payloads used against the DB layer (now against the RN
// TextInput itself), and a device/OS compatibility matrix. A small,
// genuinely fast subset actually executes today (see
// mobile-tests/patientManagement.test.js's data-driven age-boundary
// block); the rest are "Automatable" with the exact data specified,
// because a full Appium session (app relaunch + login) per boundary value
// is too slow to run all of them on every push — see
// qa-automation/README.md "Known CI fragility".
const fs = require('fs');
const path = require('path');

const PAYLOADS = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../injectionPayloads.json'), 'utf8'));

const FIELD_BOUNDARY_VALUES = {
  'login-email-input': ['', 'a', 'valid@example.com', 'no-at-sign.com', 'no-domain@', '@no-local.com', 'UPPER@EXAMPLE.COM', '  leading-space@example.com', 'trailing-space@example.com  ', 'a'.repeat(300) + '@example.com', 'unicode.tañ@example.com', 'valid+tag@example.com'],
  'login-password-input': ['', 'a', '12345678', 'ValidPass123!', 'a'.repeat(500), '   ', 'пароль123', '🔒🔑😀', 'Tab\tCharacter', 'Newline\nCharacter'],
  'signup-fullname-input': ['', 'A', 'Dr. Jane Doe', 'A'.repeat(200), '田中太郎', "O'Brien-Muñoz", '   '],
  'signup-license-input': ['', 'DDS-00000', 'A'.repeat(100), '12345', 'DDS-!@#$%'],
  'signup-clinic-input': ['', 'Clinic', 'A'.repeat(200), '田中歯科医院'],
  'signup-email-input': ['', 'valid@example.com', 'not-an-email', 'a'.repeat(300) + '@example.com'],
  'signup-password-input': ['', '1234567', '12345678', 'A'.repeat(500)],
  'signup-confirm-password-input': ['', 'mismatch', 'ValidPass123!'],
  'patient-form-name-input': ['', 'A', 'A'.repeat(200), "O'Brien-Muñoz", '田中太郎', '   ', '🦷 Patient'],
  'patient-form-phone-input': ['', '1', '123456789', '1234567890', '12345678901', 'abcdefghij', '123-456-7890', '9999999999'],
  'patient-form-age-input': ['-1', '0', '1', '17', '18', '65', '118', '119', '120', '999', 'abc', '', '3.5', '-999', 'NaN', '1e10'],
};

// The subset actually wired up as a real, executing dynamic it()-per-value
// loop today (see patientManagement.test.js) — kept small so the suite
// doesn't need dozens of extra full app-relaunch cycles per push.
const CI_EXECUTED_FIELDS = new Set(['patient-form-age-input']);

function buildBoundaryValueRows(seqStart) {
  const rows = [];
  let seq = seqStart;

  Object.entries(FIELD_BOUNDARY_VALUES).forEach(([testId, values]) => {
    const executed = CI_EXECUTED_FIELDS.has(testId);
    values.forEach((value) => {
      const id = `TC_APM_${String(seq).padStart(4, '0')}`;
      seq += 1;
      rows.push({
        id,
        module: 'Appium Mobile E2E',
        category: 'Appium',
        scenario: `${testId} boundary value: "${String(value).slice(0, 30)}"`,
        description: `Boundary-value case for the ${testId} field.`,
        precondition: 'Logged in (or on the relevant form) as the real Supabase test user',
        testData: JSON.stringify(value),
        steps: `typeInto('${testId}', ${JSON.stringify(value)}) then submit`,
        expectedResult: 'Accepted or rejected per the field\'s own validation rule (see the base test case in TEST_CASES.md for the exact rule), never a crash',
        validationType: 'UI',
        priority: 'Medium',
        automationStatus: executed
          ? `Automated — mobile-tests/patientManagement.test.js data-driven boundary block (${testId})`
          : `Automatable — exact data value specified; not run on every push to keep Appium session count manageable (see README "Known CI fragility")`,
        generationMethod: `boundary-value analysis: ${testId}`,
      });
    });
  });

  return { rows, nextSeq: seq };
}

const UI_INJECTION_FIELDS = ['login-email-input', 'patient-form-name-input'];
const INJECTION_CATEGORIES = ['sqlInjection', 'xss', 'unicodeAndInternational', 'formatStringAndTemplate'];

function buildUiInjectionRows(seqStart) {
  const rows = [];
  let seq = seqStart;

  UI_INJECTION_FIELDS.forEach((testId) => {
    INJECTION_CATEGORIES.forEach((cat) => {
      (PAYLOADS[cat] || []).forEach((payload) => {
        const id = `TC_APM_${String(seq).padStart(4, '0')}`;
        seq += 1;
        rows.push({
          id,
          module: 'Appium Mobile E2E',
          category: 'Appium',
          scenario: `${testId} renders ${cat} payload without crashing the UI: ${payload.slice(0, 30)}`,
          description: `Types a real ${cat} payload into ${testId} via the RN TextInput and confirms the app keeps rendering normally — a distinct concern from whether the DB stores it safely (see the Vulnerability sheet's DB-layer fuzz rows for that).`,
          precondition: 'On the relevant screen',
          testData: payload,
          steps: `typeInto('${testId}', ${JSON.stringify(payload)})`,
          expectedResult: 'TextInput renders the value; no RN red-screen crash; screen remains interactive',
          validationType: 'UI/Security',
          priority: 'Medium',
          automationStatus: testId === 'patient-form-name-input' && cat === 'unicodeAndInternational'
            ? 'Automated — mobile-tests/securityAndSanitization.test.js (one representative case)'
            : 'Automatable — same pattern as the one automated case, not yet extended to every payload (Appium session cost)',
          generationMethod: `real payload from testdata/injectionPayloads.json (${cat}) x RN TextInput rendering`,
        });
      });
    });
  });

  return { rows, nextSeq: seq };
}

const DEVICE_PROFILES = ['Pixel 6 (API 34)', 'Pixel 4 (API 30)', 'Samsung Galaxy S21 (API 31)', 'Generic 10in Tablet (API 33)'];
const ANDROID_VERSIONS = ['11', '12', '13', '14'];
const CORE_FLOWS = ['Login -> Dashboard', 'Create Patient', 'Upload X-Ray -> Prediction', 'Search Patient', 'Logout'];

function buildCompatibilityMatrixRows(seqStart) {
  const rows = [];
  let seq = seqStart;

  DEVICE_PROFILES.forEach((device) => {
    ANDROID_VERSIONS.forEach((version) => {
      CORE_FLOWS.forEach((flow) => {
        const id = `TC_APM_${String(seq).padStart(4, '0')}`;
        seq += 1;
        const isCiDefault = device === 'Pixel 6 (API 34)' && version === '14';
        rows.push({
          id,
          module: 'Appium Mobile E2E',
          category: 'Appium',
          scenario: `${flow} on ${device}, Android ${version}`,
          description: `Device/OS compatibility matrix cell for the "${flow}" core flow.`,
          precondition: `Emulator or device: ${device}, Android ${version}`,
          testData: `device=${device}, androidVersion=${version}`,
          steps: `Run the "${flow}" suite against this device/OS combination (config/capabilities.js device fields)`,
          expectedResult: 'Same behavior as the CI default configuration (Pixel 6, Android 14) — no device-specific rendering or crash regressions',
          validationType: 'UI/Compatibility',
          priority: isCiDefault ? 'High' : 'Low',
          automationStatus: isCiDefault
            ? 'Automated — this is the CI default emulator profile (e2e-testing.yml)'
            : 'Automatable — would need a device matrix added to e2e-testing.yml (multiple reactivecircus/android-emulator-runner configurations); not set up today, run manually before major releases instead',
          generationMethod: 'device profile x Android version x core flow compatibility matrix',
        });
      });
    });
  });

  return { rows, nextSeq: seq };
}

const GESTURE_TARGETS = [
  { screen: 'Patients directory', gesture: 'scrollDown/scrollUp through the patient list' },
  { screen: 'Dashboard', gesture: 'scrollDown/scrollUp through Quick Actions and Patient Roster' },
  { screen: 'Patients directory', gesture: 'longPress a patient card (verify no unintended context action fires — none is wired up today)' },
  { screen: 'Scan result screen', gesture: 'doubleTap the result image (verify no unintended zoom/crash — no zoom handler exists today)' },
  { screen: 'Settings', gesture: 'scrollDown to reach the Sign Out button on a small-screen device' },
];
const ORIENTATIONS = ['portrait', 'landscape'];

function buildGestureAndOrientationRows(seqStart) {
  const rows = [];
  let seq = seqStart;

  GESTURE_TARGETS.forEach(({ screen, gesture }) => {
    const id = `TC_APM_${String(seq).padStart(4, '0')}`;
    seq += 1;
    rows.push({
      id,
      module: 'Appium Mobile E2E',
      category: 'Appium',
      scenario: `${screen}: ${gesture}`,
      description: `Exercises utilities/gestures.js's ${gesture.includes('long') ? 'longPress' : gesture.includes('double') ? 'doubleTap' : 'scrollDown/scrollUp'} helper on ${screen}.`,
      precondition: `On the ${screen} screen with enough content to scroll (or a valid target element)`,
      testData: '-',
      steps: `Call the relevant utilities/gestures.js helper against ${screen}`,
      expectedResult: 'Gesture completes without error; screen remains responsive afterward',
      validationType: 'UI',
      priority: 'Low',
      automationStatus: 'Automatable — utilities/gestures.js already implements the underlying helper; not yet wired into a dedicated assertion for this screen',
      generationMethod: 'gesture x screen matrix using existing utilities/gestures.js helpers',
    });
  });

  CORE_FLOWS.forEach((flow) => {
    ORIENTATIONS.forEach((orientation) => {
      const id = `TC_APM_${String(seq).padStart(4, '0')}`;
      seq += 1;
      rows.push({
        id,
        module: 'Appium Mobile E2E',
        category: 'Appium',
        scenario: `${flow} in ${orientation} orientation`,
        description: `Confirms "${flow}" still renders/functions correctly when the device is rotated to ${orientation}.`,
        precondition: `Emulator/device rotated to ${orientation} before starting the flow`,
        testData: `orientation=${orientation}`,
        steps: `driver.setOrientation('${orientation === 'portrait' ? 'PORTRAIT' : 'LANDSCAPE'}') then run the "${flow}" flow`,
        expectedResult: 'No layout overlap/clipping that blocks interaction; flow completes the same as in portrait-default',
        validationType: 'UI',
        priority: orientation === 'landscape' ? 'Low' : 'Medium',
        automationStatus: orientation === 'portrait'
          ? 'Automated — portrait is the suite\'s default orientation for every existing test'
          : 'Automatable — driver.setOrientation() is a standard WebdriverIO/Appium call; not yet added to any suite',
        generationMethod: 'core flow x device orientation matrix',
      });
    });
  });

  return { rows, nextSeq: seq };
}

function buildAppiumExpansion() {
  let seq = 1;
  const boundary = buildBoundaryValueRows(seq);
  seq = boundary.nextSeq;
  const injection = buildUiInjectionRows(seq);
  seq = injection.nextSeq;
  const compat = buildCompatibilityMatrixRows(seq);
  seq = compat.nextSeq;
  const gestureOrientation = buildGestureAndOrientationRows(seq);

  return [...boundary.rows, ...injection.rows, ...compat.rows, ...gestureOrientation.rows];
}

module.exports = { buildAppiumExpansion };
