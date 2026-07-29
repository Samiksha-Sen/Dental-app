# Dental-app QA Automation Framework

End-to-end test automation covering the real stack: **dental_rn_app** (React
Native/Expo mobile app) → **app.py** (Flask AI API) → **Supabase Postgres**.
Three independent test runners, one merged report.

| Layer | Tooling | Lives in |
|---|---|---|
| Mobile UI | Appium 2.x (UiAutomator2) + Mocha + Chai | `mobile-tests/`, `pages/` |
| Backend API | PyTest + `requests` | `api-tests/` |
| Database | PyTest + `supabase-py` (direct table checks) | `database-tests/` |

See **[TEST_CASES.md](TEST_CASES.md)** for the full enterprise-format test
case matrix (Test ID, preconditions, steps, expected result, priority,
automation status) across all 17 modules — including the modules that turned
out to target features the app doesn't have (a Users table, a side drawer, a
Profile screen, backend authentication), documented as `N/A` with the reason
rather than silently dropped.

## Why this is scoped the way it is

This suite was built against the *actual* current app, not a generic
template. Two decisions worth knowing before you extend it:

**"Test what's real now."** A few things a typical spec for an app like
this would assume turned out not to exist yet:
- `useAppointments.js` is explicitly local/dummy data — there's no
  `appointments` table in Supabase. `mobile-tests/appointments.test.js`
  only checks the tab renders; persistence/validation tests are `it.skip()`
  with a one-line reason, not faked against a table that doesn't exist.
- There's no way to force a real Supabase JWT to expire from UI automation
  — that's `it.skip()`'d in `auth.test.js` too, with a pointer to where
  `authService.js` already handles that error path (`handleAuthError`'s
  "JWT expired" branch), for a future unit test.
- The Flask backend (`app.py`) only exposes `/health` and `/predict` —
  there are no Patient/Appointment REST endpoints. Patient data goes
  straight from the app to Supabase. `api-tests/` only covers what
  actually exists on the backend; patient CRUD is covered by
  `database-tests/` instead, because that's genuinely where it lives.
- `/predict`'s real response shape is `{condition, extraction, confidence}`
  on success or `{error: "..."}` on failure — **always HTTP 200**, even for
  rejected uploads. `app.py` never sets a status code. Tests assert on the
  `error` key, not on 4xx/5xx.

**Why not Expo Go.** The spec this framework was originally requested
against asked for automating the published Expo Go app directly (QR code /
dev-server URL entry). That's deliberately not what this framework does.
Expo Go's own launcher UI is a system app you don't control, with no
guaranteed resource-ids across versions — automating it is a different,
much less stable project than automating your own app. Instead:

- `config/capabilities.js` points Appium at a **compiled debug/dev-client
  APK** (`appium:app`, not `appium:appPackage` pointing at Expo Go).
- `.github/workflows/e2e-testing.yml` builds that APK in CI via
  `expo prebuild --platform android` + `./gradlew assembleDebug` — no EAS
  account or `EXPO_TOKEN` required.
- Locally, build the same way (`cd dental_rn_app && npx expo prebuild
  --platform android && cd android && ./gradlew assembleDebug`) and point
  `APK_PATH` in `.env` at the resulting `app-debug.apk`.

## `testID`s added to the app

Appium locates elements by accessibility id (`~testID`), which React
Native's `testID` prop maps to (content-desc on Android). These were added
to `dental_rn_app` — additive, optional props, no behavior change:

`login-email-input`, `login-password-input`, `login-submit-button`,
`signup-*-input`, `signup-submit-button`, `marketing-launch-demo-button`,
`dashboard-stat-total-scans`, `dashboard-stat-severe-caries`,
`dashboard-stat-patients-tracked`, `patients-search-input`,
`patients-add-new-button`, `patient-form-*-input`, `patient-form-save-button`,
`patient-card-<id>`, `patient-edit-button-<id>`, `patient-delete-button-<id>`,
`patient-edit-*-input`, `patient-edit-save-button`,
`scan-dropzone`, `scan-analyse-button`,
`scan-result-outcome`, `settings-api-url-input`, `settings-logout-button`,
`confirm-modal-confirm-button` / `-cancel-button`, and per-tab
`tab-dashboard` / `tab-scan` / `tab-appointments` / `tab-patients` /
`tab-settings` (via React Navigation's `tabBarTestID` option).

## Known CI fragility (be aware, not surprised)

- **Native photo picker.** `xrayUpload.test.js` pushes a fixture image to
  `/sdcard/Pictures` via ADB and selects it from Android's system photo
  picker by a fixed resource-id (`icon_thumbnail`, AOSP Photo Picker on
  API 33+). If the emulator image uses the classic Gallery app instead,
  that selector needs updating — this is the one piece of the flow that
  isn't `dental_rn_app`'s own UI, so it can't get a `testID`.
- **Native `alert()` dialogs.** Several validation/error paths (invalid
  login, "X-ray not found", etc.) surface through RN's `alert()`, which
  renders as a native Alert dialog outside the view hierarchy `testID`
  covers. Tests assert on the app *not* transitioning to the next screen
  instead of reading the alert text — see the comments in `auth.test.js`
  and `xrayUpload.test.js`.

## Setup

```bash
cd qa-automation
npm install
pip install -r requirements.txt
cp .env.example .env   # fill in real values
```

You need, at minimum, a **dedicated Supabase test project** (never point
this at production data — `database-tests/` inserts and deletes real rows)
and one real test user created in it (Supabase Auth → Users, or let
`signup.test.js`-style flow create one) matching `TEST_USER_EMAIL` /
`TEST_USER_PASSWORD` in `.env`.

## Running locally

```bash
# Backend + its tests (from repo root)
pip install -r requirements.txt
python app.py &
cd qa-automation && pytest api-tests
pytest database-tests   # needs SUPABASE_* env vars

# Mobile (needs a running Android emulator/device + Appium server)
cd dental_rn_app && npx expo prebuild --platform android && cd android && ./gradlew assembleDebug
appium --base-path /wd/hub &
cd ../../qa-automation && npm run test:mobile   # also runs report:excel via posttest hook
```

## Enabling the mobile E2E job in GitHub Actions

`mobile-e2e` in `.github/workflows/e2e-testing.yml` is gated on secrets and
**skips (not fails)** until they're set. Add these under
*Settings → Secrets and variables → Actions*:

`SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`TEST_USER_EMAIL`, `TEST_USER_PASSWORD` (a real account in your test
Supabase project). `api-and-database-tests` runs unconditionally; its
`database-tests` step also skips gracefully (with a workflow warning, not a
failure) if the Supabase secrets aren't set yet, so the workflow is green
from the first push either way.

## Reports

Every run produces `excel/Mobile_E2E_Test_Report.xlsx` (Summary, Test
Cases, API Results, Failed Tests sheets — built by
`utilities/excelReporter.js` from the Mochawesome + pytest-json-report
outputs), a Mochawesome HTML report (`reports/mochawesome/`), and JUnit XML
for all three suites (`reports/junit/`) — the JUnit files are what
GitHub Actions surfaces in the workflow run's own "Tests" summary via
`dorny/test-reporter`. On any failure, `reports/failures/` gets a
screenshot + current activity + page source + a logcat tail
(`utilities/screenshot.js`), and `logs/failures.log` gets the Winston
error-level trail.

## Test Management Excel Report

`excel/Dental_AI_Test_Management_Report.xlsx` is a separate, richer deliverable
from `Mobile_E2E_Test_Report.xlsx` above — an 11-sheet (10 + Dashboard)
enterprise test-management workbook, generated by
`utilities/testManagementReportGenerator.js`:

1. **Dashboard** — summary tiles, module coverage, execution status, recent CI runs
2. **Test Case Summary** — per-module Pass/Fail/Blocked/Not Executed with live formulas
3. **Complete Test Cases** — all 117 cases from [TEST_CASES.md](TEST_CASES.md)
4. **Mobile UI Test Cases** — the UI-validation subset, by screen/component
5. **API Test Cases** — with real request/response pairs when available
6. **Database Validation** — the Supabase-table subset
7. **AI Model Validation** — caries/validator model cases and their fixture images
8. **Automation Mapping** — exact file + test-identifier per automated case
9. **Defect Tracking** — empty template with dropdowns, ready to use
10. **Execution History** / **GitHub Actions Results** — live data from this repo's own Actions API

**How the data flows, and what's genuinely live vs. a template:**

- Sheets 2–8 are built from `testdata/testCaseCatalog.json`, which is
  *parsed directly from TEST_CASES.md* (`npm run catalog:build` regenerates
  it) — there's exactly one source of truth for what the test cases are;
  this workbook can't silently drift from the markdown document.
- Status/Actual Result columns are populated from real
  `reports/mochawesome/mochawesome.json` + `reports/*-report.json`
  (pytest-json-report) when present, joined via
  `testdata/automationMapping.json`'s exact test titles/nodeids — hand
  -verified against the real test files, not guessed. Cases with no
  matching execution data show **Not Executed**, not a fabricated result.
- Sheets 9–10 pull real run history from the GitHub Actions API
  (`npm run ci-history:fetch`, needs `GITHUB_TOKEN`+`GITHUB_REPOSITORY` —
  both set automatically inside a GitHub Actions job).
- **Defect Tracking starts empty on purpose.** No real defects have been
  logged against this suite yet; inventing "example" rows here would be
  indistinguishable from real defects once shared. The dropdowns are
  pre-wired for the first real entry.
- **ExcelJS (v4.4.0) cannot create native Excel chart objects** —
  `workbook.addChart`/`worksheet.addChart` don't exist in this library.
  The Dashboard sheet uses conditional-formatting data bars and color
  scales instead (a real ExcelJS capability) and lays the summary ranges
  out contiguously so you can select them and use Excel's own
  Insert > Chart for an actual chart in a couple of clicks.

Regenerate locally with `npm run catalog:build && npm run ci-history:fetch
&& npm run report:test-management` (the last two need a `GITHUB_TOKEN`
env var locally; CI sets it automatically). The GitHub Actions workflow
runs all three automatically in its final `test-management-report` job and
uploads the result as the **`Dental_AI_Test_Report`** artifact — check
under the workflow run's Artifacts section.

## Extending this later

- `pages/` follows the Page Object Model — add a new page class per screen,
  reuse `BasePage`'s `byTestId`/`waitForTestId`/`typeInto`/`tapTestId`.
- `utilities/gestures.js` has tap/doubleTap/longPress/swipe/scroll/
  dragAndDrop/hideKeyboard/pressBack, all driver-agnostic (take the
  WebdriverIO driver as the first argument).
- `testdata/patients.json` and `testdata/users.json` are ready-made
  data-driven fixtures (not yet wired into a parameterized runner — the
  current suites cover the same cases inline for clarity. Loop over these
  files instead once the case count grows enough to justify it).
- Tag new smoke-tier tests `@pytest.mark.smoke` (Python) so
  `npm run test:mobile:smoke` / `pytest -m smoke` stay meaningful subsets.
