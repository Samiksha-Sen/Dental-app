# Build Prompt: DentalAI — Clinical Diagnostic Network

Copy everything below into a fresh AI coding session to regenerate this project.

---

Build a full-stack AI-assisted dental X-ray diagnostic system with two parts: a Python ML backend and a React Native (Expo) mobile app, backed by Supabase for data storage.

## 1. Backend — Flask ML API (`app.py`)

A Flask app (`Flask-Cors` enabled) that exposes:

- `GET /` — renders a static demo web page (`templates/index.html`) offering the same upload-and-predict flow in a browser.
- `POST /predict` — accepts a multipart file upload (`file`) plus an optional `threshold` form field (default `0.85`). Pipeline:
  1. Save the upload to a local `uploads/` folder with a unique timestamped filename.
  2. Verify the image isn't corrupted (`PIL.Image.verify()`).
  3. Reject blank/flat images (std deviation of pixel array `< 2.0`).
  4. Run an **X-ray validation model**: extract features with `MobileNetV2` (ImageNet weights, `include_top=False`, `pooling='avg'`), then classify with a small binary classifier (`xray_validator.h5`) to confirm the image is actually a dental X-ray, not an arbitrary photo. Reject if confidence is below `threshold`.
  5. Run the **caries detection model** (`caries_model1.h5`, custom-trained, expects e.g. 256×256 RGB): load the image at the model's expected input shape, normalize, predict. Binary classification: if confidence ≥ threshold → "Caries Found" (recommend "Consultation for restorative treatment (Filling or RCT)"), else "No Caries Detected" (recommend "Routine oral hygiene and regular checkups").
  6. Delete the temp file, return JSON: `{ condition, extraction, confidence }` (or `{ error }` on any failure).

No database on the backend — it's stateless per-request. Deployable via `gunicorn` (`Procfile: web: python app.py`), e.g. on Railway.

Dependencies: `Flask`, `Flask-Cors`, `numpy`, `tensorflow`, `Pillow`, `gunicorn`.

## 2. Mobile App — React Native / Expo (`dental_rn_app/`)

Expo SDK ~54, React 19, React Native 0.81. Single `App.js` (or split into components if you prefer) implementing a **dark, glassmorphic clinical UI** themed like a secure medical/security console. No navigation library — a local `currentFlow` state machine (`'login' | 'signup' | 'otp' | 'app'`) plus an `activeTab` state machine for the main app shell.

### Visual design language
- Background: near-black navy gradient (`#090d16` → `#020617`), full-bleed `LinearGradient` behind everything.
- Cards: "glass" panels — semi-transparent white fills (`rgba(255,255,255,0.04)`), subtle `rgba(255,255,255,0.08)` borders, rounded corners (~14–16px radius).
- Accent palette: indigo `#4f46e5` / `#818cf8` (primary actions), purple `#a259ff` / `#6c5dd3` (signup), cyan `#06b6d4` / `#22d3ee` (scanning/data), green `#10b981` (healthy/success), red `#ef4444` / `#f87171` (urgent/caries), amber `#f59e0b` (pending).
- Buttons use `LinearGradient` fills, not flat colors.
- Status badges are pill-shaped with a tinted background matching the status color (urgent=red, pending=amber, cleared/healthy=green).
- Iconography is emoji-based (🦷, 📲, 🧬, ➕, 💾, ✅) rather than an icon library.
- Typography/voice: leans into a "clinical security system" register — "Decrypt & Sign In", "Attestation", "Clinical License Email", "Secure Access Password" — rather than generic consumer copy.

### Auth flow (UI-only, not wired to a real auth backend)
1. **Login** — clinic email + password fields, "Decrypt & Sign In" gradient button, a "Scan TouchID / FaceKey" biometric-styled button, link to Register.
2. **Signup** — doctor full name, dental license number, clinic name, "Send Verification Request" button → goes to OTP.
3. **OTP** — 6 individual digit boxes, a live-styled "resend in 0:45" countdown label, "Verify & Decrypt" button → enters the main app.

### Main app shell
Bottom tab bar with 6 tabs, each an emoji icon + label: Dashboard, Scan, Map, Patients, Chat, Settings.

**Dashboard tab** — clinic header with doctor initials avatar, a 3-up stats row (Total AI Scans, Severe Caries count, Avg Latency), and an "Urgent Attestations Required" card listing patients needing follow-up with tappable rows that jump to their EHR.

**Scan tab (core feature)** — X-ray upload/capture flow:
1. Pick an image via `expo-image-picker` (camera or library) or, on web, an `<input type="file">`.
2. Preview the selected image, choose the target patient from a horizontal chip selector, tap "Analyse X-Ray".
3. Animated scanning state: a progress bar (0→90% simulated via interval, then jumps to 100% on response) with rotating status text ("Loading image into memory...", "Extracting feature matrices...", "Running caries_model1.h5 classifier...", "Mapping demineralization regions..."), plus a decorative laser-scan visual and spinner.
4. POST the image as `FormData` (with a `threshold` field derived from a user-configurable confidence slider) to the backend's `/predict` endpoint.
5. Results view: condition badge (Caries Found / No Caries), a circular SVG radial gauge (`react-native-svg`) showing confidence %, a clinical recommendation, and a horizontal confidence bar. A "💾 Save to Patient EHR" button appends a diagnostic entry to the selected patient's timeline and updates their status/badge.

**Map tab** — a panoramic tooth chart: two rows of tappable tooth nodes (FDI numbering, upper 18–28 / lower 38–48), selecting one shows a diagnosis card with the same radial-gauge + recommendation treatment as the Scan results, using whichever tooth was most recently scanned.

**Patients tab (EHR directory)** —
- Search bar filtering by patient name.
- "➕ Add New Patient" toggleable form: name, allergies (free text), status picker (Healthy Clear / Pending / Urgent Care).
- Patient list cards showing name, status badge, patient ID; tapping expands an EHR timeline showing description + a chronological history feed (each entry has a date, title, and colored dot for type: caries=red, cleared/regular=green).

**Chat tab** — a simple canned-response chat companion ("AI Clinical Diagnostics Assistant") with a scrollable message list (user bubbles vs. bot bubbles) and a text input + send button. Bot replies are keyword-matched (mentions of "36", "caries"/"decay", "extraction" trigger different canned clinical explanations) rather than a real LLM integration.

**Settings tab** — toggles for "HIPAA Compliant Logging" and "Secure Cloud Sync rosters" (`Switch` components), an editable "Keras API Endpoint URL" field pointing at the Flask backend, a 3-step confidence threshold quick-select (75% Low / 85% Normal / 95% High) plus a slider-styled control, and a "Sign Out" button that returns to the login flow.

### Data & persistence — Supabase

Patient records and their diagnostic history are **not** stored locally — they live in a Supabase Postgres project, read/written directly from the RN app via `@supabase/supabase-js` (no custom backend endpoints for this; the Flask API is only used for the ML `/predict` call).

Schema:
```sql
create table patients (
  id           uuid primary key default gen_random_uuid(),
  patient_code text not null unique,        -- e.g. "PT-49201"
  name         text not null,
  status       text not null default 'Healthy Clear',   -- 'Healthy Clear' | 'Pending' | 'Urgent Care'
  badge        text not null default 'cleared',          -- 'cleared' | 'pending' | 'urgent'
  description  text not null default '',
  created_at   timestamptz not null default now()
);

create table patient_history (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid not null references patients(id) on delete cascade,
  title        text not null,
  type         text not null default 'regular',          -- 'regular' | 'caries' | 'cleared'
  event_date   timestamptz not null default now()
);
```
Enable Row Level Security on both tables. Since there's no real Supabase Auth wired up yet (login is UI-only), use permissive policies (`using (true) with check (true)`) as a placeholder, with a plan to scope them to `auth.uid()` once real accounts exist.

App behavior:
- On mount, fetch all patients with their nested `patient_history`, sorted by most recent, map into the UI's patient shape.
- Registering a new patient inserts a `patients` row + an initial "Initial Registration & EHR Profile Created" `patient_history` row.
- Saving a scan to EHR inserts a new `patient_history` row and updates the patient's `status`/`badge`/`description` in one operation.
- Supabase URL and anon key are read from Expo public env vars (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`) via a `.env` file (gitignored) — never embed the Supabase `service_role` key in the client app.

### Key dependencies
`expo`, `expo-image-picker`, `expo-linear-gradient`, `expo-status-bar`, `react-native-svg`, `@supabase/supabase-js`, `axios` (or plain `fetch`).

## 3. What NOT to replicate
- `dental_ai_app/` — an earlier, now-abandoned Flutter prototype of the same app. Build only the React Native version.
- Real authentication — the login/signup/OTP flow in this project is intentionally UI-only/mocked; treat it as a placeholder unless you want to add real Supabase Auth on top.
