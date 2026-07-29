# Dental-app — Test Case Document

Enterprise-format test case matrix for the real application: React Native/Expo
(`dental_rn_app`) → Flask AI API (`app.py`) → Supabase Postgres. Every case
below was checked against the actual codebase before being written — where a
requested module targets something the app doesn't have (a Users table, a
side drawer, a Profile screen, a dropdown/checkbox component, backend
authentication), the case is marked **N/A** with the reason, rather than
describing a step against a feature that doesn't exist. See
[README.md](README.md) for the same policy applied to the automation code.

**Columns:** Validation Type = UI / API / Database / AI. Automation Status =
`Automated` (already implemented, file referenced) / `Automatable` (feasible,
not yet written) / `Manual` / `N/A`.

---

## MODULE 1 — Application Launch

| Test ID | Scenario | Preconditions / Test Data | Steps | Expected Result | Validation | Priority | Automation |
|---|---|---|---|---|---|---|---|
| TC_APP_001 | Cold launch on a fresh install | Debug APK installed, no prior app data (`noReset:false`) | 1. `activateApp` the package 2. Wait for either marketing home or dashboard | App renders `marketing-launch-demo-button` (no session) or the dashboard (restored session) within 20s, no crash | UI | High | Automated — `mobile-tests/auth.test.js` `beforeEach` (every suite launches fresh and asserts a screen loads) |
| TC_APP_002 | Launch with no network connectivity | Emulator network disabled (`adb shell svc wifi disable` + `svc data disable`) | 1. Disable network 2. Launch app 3. Observe marketing/login screen | App shell still renders (it's static content); a subsequent login attempt fails with `authService.js`'s "Network error: Unable to connect to Supabase authentication server." alert, not a crash | UI | Medium | Automatable — needs an `adb shell svc` step wired into a test; not yet implemented (no test flips airplane mode today) |
| TC_APP_003 | Background and foreground the app | Logged in, on dashboard | 1. `driver.background(5)` (Appium's real background/resume, not kill+relaunch) 2. Wait 5s 3. Assert dashboard still visible | Dashboard still displayed, no re-login required, no crash | UI | High | Automated — `mobile-tests/appLifecycle.test.js` |
| TC_APP_004 | Session restored after full app restart (kill + relaunch) | Logged in | 1. `terminateApp` 2. `activateApp` | Redirects straight to dashboard (Supabase session persisted via `authService.getSession()`) | UI | High | Automated — `mobile-tests/auth.test.js` "keeps the user logged in after an app restart" |

---

## MODULE 2 — User Authentication

| Test ID | Scenario | Preconditions / Test Data | Steps | Expected Result | Validation | Priority | Automation |
|---|---|---|---|---|---|---|---|
| TC_AUTH_001 | Empty email | password = valid | Submit login with email="" | Stays on login screen (no navigation) | UI | High | Automated — `auth.test.js` |
| TC_AUTH_002 | Empty password | email = valid | Submit login with password="" | Stays on login screen | UI | High | Automated — `auth.test.js` |
| TC_AUTH_003 | Invalid email format | email="not-an-email" | Submit login | Stays on login screen | UI | Medium | Automated — `auth.test.js` |
| TC_AUTH_004 | Incorrect password for a real account | email=valid, password=wrong | Submit login | `supabase.auth.signInWithPassword` rejects; `authService.js` maps to "Invalid email or password."; stays on login screen | UI/API | High | Automated — `auth.test.js` "rejects wrong credentials" |
| TC_AUTH_005 | Non-existent email ("incorrect username") | email="doesnotexist@example.com" | Submit login | Same rejection path as TC_AUTH_004 (Supabase doesn't distinguish unknown-user vs wrong-password, by design, to avoid user enumeration) | UI/API | Medium | Automatable — same POM call, new data row; not yet a distinct test |
| TC_AUTH_006 | SQL-injection-style input in email field | email=`' OR '1'='1` | Submit login | Treated as a plain (invalid) email string — Supabase's client uses parameterized REST calls, not raw SQL, so no injection is possible; expect the same "invalid credentials" rejection, not an error/crash | UI/Security | High | Automatable — trivial data-row addition to TC_AUTH_004's test |
| TC_AUTH_007 | Special characters in password field | password=`p@$$w0rd!#%^&*()` | Submit login | `TextInput` accepts the value; request sent as-is; rejected only because it doesn't match the real password, not because of the characters | UI | Low | Automatable |
| TC_AUTH_008 | Valid credentials | Real Supabase test account | Submit login | Navigates to `/(portal)/dashboard` | UI/API | High | Automated — `auth.test.js` "logs in with valid credentials" |
| TC_AUTH_009 | Logout | Logged in | Tap Settings tab → Sign Out → confirm | Returns to login screen; `supabase.auth.signOut()` clears the session; a subsequent app restart does **not** restore the dashboard | UI/API | High | Automated — `auth.test.js` "Logout" |
| TC_AUTH_010 | Token invalidation after logout | Logged out per TC_AUTH_009 | Attempt any Supabase-backed screen action | RLS-governed calls fail/return empty since `auth.uid()` is null; app already handles this via each service's generic error path | Database | Medium | Manual — provable via DB tests with a captured pre/post-logout key, not yet scripted |
| TC_AUTH_011 | Session persists across app close/reopen | Logged in | Kill app, relaunch | Same as TC_APP_004 | UI | High | Automated (duplicate of TC_APP_004, listed here for auth-module traceability) |
| TC_AUTH_012 | Expired JWT handling | N/A — forcing a real token expiry needs control over the Supabase project's token TTL, unreachable from UI automation | — | `authService.js`'s `handleAuthError()` has a dedicated "JWT expired" → "Session expiration" branch, confirming the app *code* handles it | UI | Medium | Manual / N/A for E2E — see `it.skip()` in `auth.test.js` with the same reasoning; a proper test belongs at the unit level around `handleAuthError()` |

---

## MODULE 3 — Patient Management

| Test ID | Scenario | Preconditions / Test Data | Steps | Expected Result | Validation | Priority | Automation |
|---|---|---|---|---|---|---|---|
| TC_PAT_001 | Create patient — empty name | phone=valid 10-digit, age=valid | Open form, leave name blank, Save | Form stays open, `alert('Please enter patient name.')`, no row created | UI | High | Automated — `patientManagement.test.js` |
| TC_PAT_002 | Create patient — invalid phone (not 10 digits) | phone="123" | Save | `newPatientPhoneError` shown, form stays open | UI | High | Automated — `patientManagement.test.js` |
| TC_PAT_003 | Create patient — invalid age (0 or >119) | age="0" | Save | `newPatientAgeError` shown | UI | High | Automated — `patientManagement.test.js` |
| TC_PAT_004 | Create patient — maximum length input | name = 200-char string | Save | `patients.name` is `text` (unbounded) in schema.sql — accepted and stored in full; UI wraps/scrolls, no truncation bug expected | UI/Database | Low | Automatable — not yet written |
| TC_PAT_005 | Create patient — special characters in name | name=`O'Brien-Muñoz #2` | Save | Stored and displayed verbatim — Supabase client parameterizes inserts, no escaping issue; also doubles as an input-sanitization check | UI/Database/Security | Medium | Automated — `mobile-tests/securityAndSanitization.test.js` |
| TC_PAT_006 | Create patient — duplicate name | Two patients, same name, different phone/age | Create twice | Both succeed with distinct `patient_code`s — **there is no uniqueness constraint on `patients.name`** in schema.sql; this is documented app behavior, not a bug | UI/Database | Medium | Automated — `patientManagement.test.js` "flags creating the same patient twice" |
| TC_PAT_007 | Create patient — valid data (happy path) | Unique name/phone/age | Fill form, Save | Success alert, patient card appears in directory, `patients` row + auto `patient_code` (`PAT-####`) created | UI/API/Database | High | Automated — `patientManagement.test.js` |
| TC_PAT_008 | View patient list | ≥1 patient exists | Open Patients tab | List renders; each card shows name, ID, age, phone | UI | High | Automated — implicit in `patientManagement.test.js`/`search.test.js` assertions |
| TC_PAT_009 | View patient detail (expand card) | Patient with history entries | Tap a patient card | Card expands showing `patient_history` timeline entries | UI/Database | Medium | Automatable — not yet a dedicated test |
| TC_PAT_010 | UI/API/DB data consistency for a patient | Patient created via TC_PAT_007 | Compare directory card text, `databaseService.getPatients()` response shape, and the `patients` row directly | Name/phone/age match across all three layers | UI/API/Database | High | Automated — cross-checked via `database-tests/test_patients_table.py` + UI assertions in `patientManagement.test.js` (not yet a single combined test) |
| TC_PAT_011 | Update patient — edit name/phone/age | Existing patient | Tap edit (pencil icon) → change fields → Save Changes | Card reflects new values; `patients` row updated via `updatePatientContactInfo()` | UI/API/Database | High | Automated — `mobile-tests/patientManagement.test.js` "Update Patient" (new `patient-edit-*` testIDs) |
| TC_PAT_012 | Update patient — invalid phone on edit | Existing patient | Edit phone to "123" → Save Changes | `editPhoneError` shown, sheet stays open | UI | Medium | Automated — same suite |
| TC_PAT_013 | Delete patient — confirm | Existing patient | Tap trash icon → confirm in `ConfirmModal` | Card removed from directory; `patients` row deleted; cascade-deletes its `patient_history` rows (schema.sql `on delete cascade`) | UI/Database | High | Automated — `mobile-tests/patientManagement.test.js` "Delete Patient" |
| TC_PAT_014 | Delete patient — cancel | Existing patient | Tap trash icon → Cancel | Modal closes, row untouched | UI | Medium | Automated — same suite |

---

## MODULE 4 — Patient Search

| Test ID | Scenario | Preconditions / Test Data | Steps | Expected Result | Validation | Priority | Automation |
|---|---|---|---|---|---|---|---|
| TC_SRCH_001 | Search by full name | Known patient exists | Type full name in search box | Matching card shown | UI | High | Automated — `search.test.js` |
| TC_SRCH_002 | Search by partial name | Known patient exists | Type first word of name | Matching card shown (client-side `includes()` filter in `patients.js`) | UI | High | Automated — `search.test.js` |
| TC_SRCH_003 | Search by Patient ID | Known patient exists | Type `patient_code`, e.g. `PAT-0002` | Matching card shown (`p.id.toLowerCase().includes(q)` in the filter) | UI | Medium | Automatable — same pattern as TC_SRCH_001, not yet a distinct test |
| TC_SRCH_004 | Search by phone number | Known patient exists | Type phone digits | Matching card shown | UI | Medium | Automatable — filter supports it (`p.phone.includes(...)`), no dedicated test yet |
| TC_SRCH_005 | Search — no match | Query that matches nothing | Type "Zzzznonexistentpatientxyz" | No result cards render; the search input itself isn't mistaken for a match | UI | Medium | Automated — `search.test.js` |
| TC_SRCH_006 | Search performance with a large dataset | ≥500 seeded patient rows | Type a query, measure time to filtered render | Filter is client-side over an already-fetched array — response should be near-instant regardless of dataset size, but the *initial* `getPatients()` fetch/render time should be budgeted | UI/Performance | Low | Manual — needs a seeding script for 500+ rows, not built; flagged as future work in README |

---

## MODULE 5 — Dental X-Ray Upload

| Test ID | Scenario | Preconditions / Test Data | Steps | Expected Result | Validation | Priority | Automation |
|---|---|---|---|---|---|---|---|
| TC_XRAY_001 | Valid X-ray upload — full flow | Logged in, API URL configured, sample from `positive_xrays/` pushed to device | Select patient → open dropzone → pick pushed image → Analyse | Progress UI plays through; `scan-result-outcome` shows "Caries Found" or "No Caries Detected"; `scans` row created then updated with `prediction`/`confidence`; `reports` row created | UI/API/AI/Database | High | Automated — `xrayUpload.test.js` + `database-tests/test_scans_reports_tables.py` (see TC_RPT_003 for the combined cross-check) |
| TC_XRAY_002 | Invalid upload — ordinary (non-X-ray) photo | Random high-variance photo pushed | Same flow | `xray_validator.h5` rejects it; `scan-result-outcome` never appears (native `alert()` shows "X-ray not found.") | UI/AI | High | Automated — `xrayUpload.test.js` "rejects a non-X-ray photo" |
| TC_XRAY_003 | Invalid upload — blank/flat image | Solid-gray PNG | POST directly to `/predict` | `{"error": "X-ray not found.\nPlease upload a valid dental X-ray image."}` (std-dev < 2.0 check in `app.py`) | API | High | Automated — `api-tests/test_predict_api.py::test_predict_rejects_blank_image` |
| TC_XRAY_004 | Invalid upload — corrupted file | Truncated/garbage PNG bytes | POST to `/predict` | `{"error": "Invalid or corrupted image file."}` | API | High | Automated — `test_predict_rejects_corrupted_image` |
| TC_XRAY_005 | Invalid upload — unsupported format (.txt masquerading as upload) | Plain text file | POST to `/predict` | Rejected with an error (`Image.open()`/`img.verify()` fails) | API | Medium | Automated — `test_predict_rejects_unsupported_file_format` |
| TC_XRAY_006 | Invalid upload — PDF file | A `.pdf` file | POST to `/predict` | Same rejection path as TC_XRAY_005 — `Image.open()` cannot parse a PDF, fails `img.verify()` | API | Medium | Automatable — same fixture pattern as TC_XRAY_005 with a `.pdf` extension, not yet a distinct test |
| TC_XRAY_007 | Missing file field | POST `/predict` with no `file` part | — | `{"error": "No file uploaded"}` | API | Medium | Automated — `test_predict_missing_file_field_returns_error` |
| TC_XRAY_008 | Maximum file size handling | A very large (e.g. 30MB) valid image | POST to `/predict` | `app.py` has no explicit `MAX_CONTENT_LENGTH` set — Flask's default is unlimited; expect either a slow-but-successful response or a memory/timeout failure on very large files. **This is a real, currently-unmitigated gap**, not a tested-and-passing guarantee | API | Medium | Manual — flagged finding; recommend adding `MAX_CONTENT_LENGTH` to `app.py`, tracked as a follow-up, not asserted as passing today |
| TC_XRAY_009 | Multiple sequential uploads | 2+ valid X-rays, same patient | Upload, save to EHR, reset, upload again | Each produces its own `scans`/`reports` row; `patient_history` accumulates entries via `addPatientHistory()` | UI/Database | Medium | Automatable — extend `xrayUpload.test.js` with a second pass, not yet written |

---

## MODULE 6 — AI Caries Detection

| Test ID | Scenario | Preconditions / Test Data | Steps | Expected Result | Validation | Priority | Automation |
|---|---|---|---|---|---|---|---|
| TC_AI_001 | Positive case — caries-positive X-ray | Sample from `positive_xrays/` | POST `/predict` | `condition="Caries Found"`, `confidence` in (0,100], `extraction`="Consultation for restorative treatment (Filling or RCT)" | AI/API | High | Automated — `test_predict_valid_xray_returns_condition_and_confidence` |
| TC_AI_002 | Negative case — healthy X-ray | A known negative sample (**gap:** repo only ships `positive_xrays/`, no `negative_xrays/` fixture set) | POST `/predict` | `condition="No Caries Detected"` | AI/API | High | Manual / blocked — no negative-sample fixtures exist in the repo to automate against; recommend adding a `negative_xrays/` folder alongside `positive_xrays/` |
| TC_AI_003 | Threshold parameter is actually applied | Sample X-ray | POST with `threshold=0.0` | `confidence >= 0.0` is always true, and the validator's `prob < 0.0` never true → always "Caries Found", proving the param is read | AI/API | Medium | Automated — `test_predict_threshold_is_wired_into_both_models` |
| TC_AI_004 | AI backend unreachable from the mobile app | Settings API URL pointed at an invalid/unreachable host | Attempt a scan | `predictXray()`'s fetch throws; `scan.js`'s catch block alerts "Scan failed." and resets scanning state — no crash, no stuck spinner | UI/Error handling | High | Automated — `mobile-tests/errorHandling.test.js` |
| TC_AI_005 | Model timeout | Simulated via an artificially slow endpoint | Attempt a scan | Not implemented in `app.py` (no request timeout configured either client- or server-side) — a genuinely slow model call would hang the RN `fetch` indefinitely rather than time out gracefully | AI/Error handling | Medium | Manual — flagged finding, not a passing test; recommend adding a client-side fetch timeout |
| TC_AI_006 | Invalid/malformed AI response | N/A — `app.py` always returns well-formed JSON (either the success shape or `{error}`) for every code path that's reachable | — | — | AI | Low | N/A — no code path in `app.py` produces a malformed response |

---

## MODULE 7 — X-Ray Report

| Test ID | Scenario | Preconditions / Test Data | Steps | Expected Result | Validation | Priority | Automation |
|---|---|---|---|---|---|---|---|
| TC_RPT_001 | Report generation on scan completion | Valid scan per TC_XRAY_001 | Complete a scan | `databaseService.createReport()` inserts a `reports` row with `scan_id`, `severity`, `recommendation`, `created_at` (default `now()`) | Database | High | Automated — `database-tests/test_scans_reports_tables.py::test_create_report_linked_to_scan` |
| TC_RPT_002 | Confidence percentage displayed matches API response | Completed scan | Compare `CircularGauge` value on the result screen to the raw `/predict` response | Values match (`predictionConfidence` state is set directly from `data.confidence`) | UI/API | Medium | Automatable — not yet a dedicated assertion (implicitly true given TC_XRAY_001's flow) |
| TC_RPT_003 | End-to-end: UI upload produces the exact DB rows | Fresh patient + fresh scan via mobile UI | Run TC_XRAY_001's flow, then query `scans`/`reports` directly via `supabaseTestHelper.js` | A `scans` row exists with matching `patient_id` and non-null `prediction`; a linked `reports` row exists | UI+Database (cross-layer) | High | Automated — `mobile-tests/xrayUpload.test.js` "persists a matching scans+reports row" |
| TC_RPT_004 | Patient mapping is correct | Two different patients, one scan each | Scan for Patient A, then Patient B | Each `scans.patient_id` matches the patient selected at scan time, not a stale previous selection | UI/Database | Medium | Automatable — not yet written |

---

## MODULE 8 — Appointment Management

**Scope note:** `useAppointments.js` is explicitly local/dummy in-memory data —
its own top-of-file comment states "There is no `appointments` table in
Supabase yet." Every case below that would require persistence is marked
N/A rather than tested against a table that doesn't exist.

| Test ID | Scenario | Expected Result | Validation | Priority | Automation |
|---|---|---|---|---|---|
| TC_APPT_001 | Appointments tab renders | Tab loads without crashing | UI | Medium | Automated — `mobile-tests/appointments.test.js` |
| TC_APPT_002 | Create appointment persists a Supabase record | N/A — no `appointments` table exists | — | Medium | N/A |
| TC_APPT_003 | Update appointment | N/A — same reason | — | Low | N/A |
| TC_APPT_004 | Delete appointment | N/A — same reason | — | Low | N/A |
| TC_APPT_005 | Empty required fields rejected | N/A — would need testIDs on a form backed by real data first | — | Low | N/A |
| TC_APPT_006 | Past-date selection rejected | N/A — same reason | — | Low | N/A |
| TC_APPT_007 | View appointments list (in-memory) | Locally generated dummy schedule renders per day | UI | Low | Automatable — trivial, not prioritized since it's not real data |

---

## MODULE 9 — Dashboard

| Test ID | Scenario | Expected Result | Validation | Priority | Automation |
|---|---|---|---|---|---|
| TC_DASH_001 | Three stat cards render | Total AI Scans, Severe Caries, Patients Tracked all visible | UI | High | Automated — `dashboard.test.js` |
| TC_DASH_002 | Tap "Patients Tracked" → detail screen | Navigates to `/(portal)/dashboard/patients` | UI | Medium | Automated — `dashboard.test.js` |
| TC_DASH_003 | Tap "Total AI Scans" → detail screen | Navigates to `/(portal)/dashboard/ai-scans` | UI | Medium | Automated — `dashboard.test.js` |
| TC_DASH_004 | Tap "Severe Caries" → detail screen | Navigates to `/(portal)/dashboard/severe-caries` | UI | Medium | Automated — `dashboard.test.js` |
| TC_DASH_005 | Patients Tracked count matches `patients` row count | Displayed number == `select count from patients` | UI/Database | High | Automated — `dashboard.test.js` |
| TC_DASH_006 | Total AI Scans count matches `scans` row count | Displayed number == `select count from scans` | UI/Database | High | Automated — `dashboard.test.js` (extended) |
| TC_DASH_007 | Severe Caries count matches urgent-badged patients | Displayed number == patients where `badge='urgent'` | UI/Database | Medium | Automatable — not yet written (same pattern as TC_DASH_005/006) |

---

## MODULE 10 — Navigation

**Scope note:** the app has a bottom tab bar only — no side/drawer navigation
and no separate Profile screen exist anywhere in `dental_rn_app` (confirmed:
zero matches for "Drawer" in the whole app; "profile" only appears as UI copy
on patient-related buttons, not a screen). Those sub-modules are marked N/A.

| Test ID | Scenario | Expected Result | Validation | Priority | Automation |
|---|---|---|---|---|---|
| TC_NAV_001 | Bottom tab: Dashboard | Opens Dashboard screen | UI | High | Automated — used as setup in every suite |
| TC_NAV_002 | Bottom tab: Scan | Opens Scan/upload screen | UI | High | Automated |
| TC_NAV_003 | Bottom tab: Appointments | Opens Appointments screen | UI | Medium | Automated |
| TC_NAV_004 | Bottom tab: Patients | Opens Patients directory | UI | High | Automated |
| TC_NAV_005 | Bottom tab: Settings | Opens Settings screen | UI | Medium | Automated |
| TC_NAV_006 | "X-Ray Gallery" bottom nav item | N/A — no such tab exists; a `gallery/` component folder exists in source but is not imported by any routed screen (dead code from a removed feature) | — | — | N/A |
| TC_NAV_007 | Side drawer open/select/close | N/A — no drawer navigation implemented anywhere in the app | — | — | N/A |
| TC_NAV_008 | Android hardware back button | From Patients tab, press hardware back | App does not exit/crash; returns to the previously focused tab or shows the exit-confirmation the OS provides on the root screen | UI | Medium | Automated — `mobile-tests/navigation.test.js` |

---

## MODULE 11 — UI Components

Rather than a separate synthetic suite, these are cross-referenced to where
each is already genuinely exercised — testing "does a button click" in
isolation with no real assertion attached is low-value:

| Component | Covered by | Automation |
|---|---|---|
| Buttons (enabled/press response) | Every `tapTestId()` call across all suites | Automated |
| Buttons (loading/disabled state) | `login-submit-button`'s `loading` prop swaps to an `ActivityIndicator`; not independently asserted | Automatable — not yet a dedicated check |
| Text fields (input/clear/max length) | Patient form phone (`maxLength=10`) / age (`maxLength=3`) validation tests | Automated — `patientManagement.test.js` |
| Chip-style selection ("Initial Diagnosis Status") | Not yet exercised — `STATUS_OPTIONS` chips in the new-patient form | Automatable — not yet written |
| Native dropdown / `<Picker>` | N/A — no such component exists anywhere in the app (only `expo-image-picker`'s photo picker, and an unrelated internal `pickerFor` state name in `CompareModal.js`) | N/A |
| Checkbox | N/A — no `Checkbox` component anywhere; Settings uses `Switch` toggles instead | N/A |
| Toggle switches (HIPAA/Cloud Sync) | Local-only UI state, not persisted (by explicit code comment) — no backend to verify against | Manual |
| Dialogs (`ConfirmModal` open/confirm/cancel) | Delete-patient and logout flows | Automated |
| Toast/Alert messages | Native `alert()` — outside the RN view hierarchy `testID` covers; tests assert on the resulting navigation/state instead of alert text (documented in README "Known CI fragility") | Manual (text content) / Automated (side effect) |

---

## MODULE 12 — API Test Cases

| Test ID | Endpoint | Method | Expected Status | Validates | Automation |
|---|---|---|---|---|---|
| TC_API_001 | `/health` | GET | 200, `{status:"ok"}` | Backend liveness | Automated — `test_health_api.py` |
| TC_API_002 | `/health` | GET | 200, `models_loaded: true` | Both `.h5` models loaded at boot | Automated |
| TC_API_003 | `/health` | GET | — | Response time < 2s (no inference work) | Automated |
| TC_API_004 | `/predict` | POST | 200, `{condition, extraction, confidence}` | Happy path | Automated — `test_predict_api.py` |
| TC_API_005 | `/predict` | POST | 200, `{error}` | Blank/corrupted/unsupported/non-X-ray rejections (TC_XRAY_003–006) | Automated |
| TC_API_006 | `/predict` | POST | 200, `{error:"No file uploaded"}` | Missing file field | Automated |
| TC_API_007 | `/predict` | POST | — | Latency budget (<15s, two on-CPU model passes) | Automated |
| TC_API_008 | Authentication APIs | N/A | N/A | **The Flask backend has no authentication endpoints or token checks of any kind** — login/signup are entirely client-side Supabase Auth calls, never touching `app.py`. There is nothing for a PyTest "Authentication API" suite to hit | N/A |
| TC_API_009 | Patient APIs | N/A | N/A | The Flask backend exposes no patient CRUD endpoints — the RN app talks to Supabase directly (`databaseService.js`). Patient CRUD is validated in `database-tests/` instead (Module 13) | N/A — see Module 13 |
| TC_API_010 | Appointment APIs | N/A | N/A | No such endpoints exist, and no `appointments` table backs them either (Module 8) | N/A |

---

## MODULE 13 — Supabase Database

**Scope note:** there is no "Users" table — user identity lives in Supabase's
built-in `auth.users`, with `profiles` as the app-level extension table. "XRay
Reports" maps to the real `reports` table (linked to `scans`).

| Test ID | Table | Operation | Expected Result | Automation |
|---|---|---|---|---|
| TC_DB_001 | `profiles` | Insert (upsert after signup) | Row created with `id` == `auth.users.id` | Automated — `test_profiles_table.py` |
| TC_DB_002 | `profiles` | Select | Fetched row matches inserted values | Automated |
| TC_DB_003 | `profiles` | Cascade delete | Deleting the `auth.users` row cascades to `profiles` (schema.sql FK) | Automated |
| TC_DB_004 | `patients` | Insert | Row created with all columns | Automated — `test_patients_table.py` |
| TC_DB_005 | `patients` | Select by id | Fetched row matches | Automated |
| TC_DB_006 | `patients` | Update | Contact info fields update correctly | Automated |
| TC_DB_007 | `patients` | Delete | Row removed; cascades to `patient_history` | Automated |
| TC_DB_008 | `patients` | Duplicate `patient_code` rejected | `patient_code` has a DB-level `unique` constraint (schema.sql) — a second insert with the same code raises a Postgres unique-violation error | Automated — `database-tests/test_patients_table.py::test_duplicate_patient_code_is_rejected` |
| TC_DB_009 | `patient_history` | Insert linked to a patient | FK to `patients.id` enforced | Automated |
| TC_DB_010 | `patient_history` | Cascade delete with parent patient | Confirmed via schema.sql `on delete cascade` | Automated |
| TC_DB_011 | `scans` | Insert / update prediction / delete | Full lifecycle matches `scanService.js`'s own calls | Automated — `test_scans_reports_tables.py` |
| TC_DB_012 | `reports` | Insert linked to scan, fetch ordered newest-first | Matches `databaseService.js`'s `createReport`/`getReportsByScan` | Automated |
| TC_DB_013 | Data integrity — orphaned `reports` row | N/A — `reports.scan_id` is `not null references scans(id) on delete cascade`; a scan's reports always cascade-delete with it, so an orphan can't occur by construction | — | N/A (schema-guaranteed, not independently testable) |
| TC_DB_014 | Duplicate prevention — `patients.name` | **No** uniqueness constraint exists on `name` (only on `patient_code`) — documented as intended current behavior, not a bug | Database | Automated — see TC_PAT_006 |

---

## MODULE 14 — Security

**Key findings, stated plainly rather than tested-and-passing:**

1. **`app.py` has zero authentication.** `/health` and `/predict` accept
   requests from anyone with no API key, JWT, or token check. "Invalid
   token" / "expired token" / "API authorization" test cases are **not
   applicable** — there's no auth layer on this backend to test. This is
   worth the app owner's attention as a real gap (anyone can burn compute
   calling `/predict` for free), not something this test suite can "pass."
2. **RLS is intentionally permissive right now.** `patient_history`'s
   policies are `using (true)` (any authenticated *or anonymous* caller can
   read/write); `scans`' policies allow `auth.uid() = user_id OR auth.role()
   = 'anon'`. This matches `schema.sql`'s own top-of-file note that RLS is
   deliberately loose until real per-clinician access control is designed.
   Security tests here document current behavior, not an idealized denial
   that would just fail against the real, intended-for-now configuration.

| Test ID | Scenario | Expected Result | Validation | Priority | Automation |
|---|---|---|---|---|---|
| TC_SEC_001 | SQL injection string in login email | Rejected as invalid credentials, not executed as SQL (Supabase client is parameterized) | UI/Security | High | Automatable — same as TC_AUTH_006, a data-row addition to `auth.test.js`'s existing rejected-login test; not yet written as its own case |
| TC_SEC_002 | Special/stored characters in patient name are stored and rendered safely | No script execution, no corruption on read-back | UI/Database/Security | Medium | Automated — `mobile-tests/securityAndSanitization.test.js` |
| TC_SEC_003 | Anonymous Supabase key can read `patient_history` | Confirmed allowed by current RLS policy (`using (true)`) — documents the real, current posture | Database/Security | Medium | Automated — `database-tests/test_security_rls.py` |
| TC_SEC_004 | `/predict` accepts unauthenticated requests | Confirmed — no auth check exists in `app.py` | API/Security | High | Automated — `api-tests/test_predict_api.py::test_predict_requires_no_authentication` (documents the finding) |
| TC_SEC_005 | Invalid/expired backend token | N/A — no token mechanism exists on the Flask backend | — | — | N/A |
| TC_SEC_006 | Unauthorized database access is blocked | Partially N/A — by current RLS design, most tables are broadly readable; only `profiles` genuinely enforces `auth.uid() = id` | Database/Security | Medium | Automated — `test_security_rls.py` covers the `profiles` case, which *does* enforce isolation |

---

## MODULE 15 — Performance

| Test ID | Scenario | Budget | Validation | Automation |
|---|---|---|---|---|
| TC_PERF_001 | App cold-start to first interactive screen | < 20s on a CI emulator (generous — cold JS bundle load + Metro-bundled dev build is slower than a production build) | UI | Automated — `mobile-tests/appLifecycle.test.js` |
| TC_PERF_002 | `/health` response time | < 2s | API | Automated — `test_health_api.py` |
| TC_PERF_003 | `/predict` response time | < 15s (two on-CPU model passes) | API | Automated — `test_predict_api.py` |
| TC_PERF_004 | Image upload transfer time | Not budgeted — depends entirely on device network conditions, not app code; out of scope for a CI assertion | UI | Manual |
| TC_PERF_005 | Database query time (`getPatients()` with joined `patient_history`) | Not currently budgeted/measured | Database | Manual — recommend adding a timed assertion once a realistic seeded dataset size (Module 4's TC_SRCH_006) exists |

---

## MODULE 16 — Error Handling

| Test ID | Scenario | Expected Result | Validation | Priority | Automation |
|---|---|---|---|---|---|
| TC_ERR_001 | Flask backend unreachable during a scan | `predictXray()` throws; `scan.js` catches it, alerts "Scan failed.", resets `isScanning` — no stuck spinner, no crash | UI | High | Automated — `mobile-tests/errorHandling.test.js` (same test as TC_AI_004) |
| TC_ERR_002 | Supabase unreachable during login | `authService.js` maps the fetch failure to "Network error: Unable to connect to Supabase authentication server." | UI | High | Manual — needs a way to block Supabase's specific host from the emulator without also blocking the app under test's own traffic; not yet scripted |
| TC_ERR_003 | Supabase unreachable during a DB read (e.g. patient list) | `databaseService.js`'s `handleDatabaseError()` maps it to a friendly "Network error" rather than a raw exception | UI | Medium | Manual — same blocker as TC_ERR_002 |
| TC_ERR_004 | Timeout on `/predict` | See TC_AI_005 — no client or server timeout is configured today; this is a documented gap, not a passing test | API | Medium | Manual / finding |
| TC_ERR_005 | Malformed `/predict` response | N/A — see TC_AI_006, no code path produces one | — | — | N/A |

---

## MODULE 17 — Regression Suite

**Smoke tier** (tagged `@smoke` in Mocha titles / `@pytest.mark.smoke`) —
the minimum set that must pass before anything ships:

- TC_AUTH_008 (valid login) · TC_PAT_007 (create patient) · TC_XRAY_001
  (valid scan end-to-end) · TC_DASH_001 (dashboard loads) · TC_API_001/002
  (`/health`) · TC_API_004 (`/predict` happy path)

Run via `npm run test:mobile:smoke` / `pytest -m smoke`.

**Regression tier** — everything in this document marked `Automated`, run on
every push via `.github/workflows/e2e-testing.yml` (API+DB job) and, once the
required secrets are configured, the `mobile-e2e` job.

**Priority legend used throughout:** P0 = High, P1 = Medium, P2 = Low.

---

## Summary: what's newly automated vs. documented-only

This document was written against the framework already in `qa-automation/`
after this review — the following files were **added** to close the gaps
this matrix identified (see commit history for the exact diff):

- `mobile-tests/appLifecycle.test.js` — TC_APP_001/003, TC_PERF_001
- `mobile-tests/navigation.test.js` — TC_NAV_008
- `mobile-tests/errorHandling.test.js` — TC_AI_004, TC_ERR_001
- `mobile-tests/securityAndSanitization.test.js` — TC_SEC_002
- `database-tests/test_security_rls.py` — TC_SEC_003, TC_SEC_006
- Extended `patientManagement.test.js` — TC_PAT_011–014 (Update/Delete)
- Extended `dashboard.test.js` — TC_DASH_006
- Extended `test_patients_table.py` — TC_DB_008
- Extended `test_predict_api.py` — TC_SEC_004

Everything else marked `Manual` above is a genuine, stated gap (needs seed
data, needs network-partition tooling, or targets a feature that doesn't
exist) — not silently skipped.
