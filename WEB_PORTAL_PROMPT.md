# Build Prompt: DentalAI Clinical Portal (Web)

Copy everything below into a fresh AI coding session to build the web companion to the existing `dental_rn_app` mobile app and `app.py` Flask backend in this repo.

---

Build a complete, premium, production-ready single-page web application using **React + Vite (no TypeScript)**. The application is named **"DentalAI Portal"** — a clinical AI-powered dental caries early-detection and EHR portal. It is the **web companion** to an existing React Native mobile app (`dental_rn_app`) and shares the same Flask ML backend (`app.py`) and Supabase database. Use `lucide-react` for all icons. Use only vanilla CSS (no Tailwind). Use Google Fonts: **Outfit** and **Plus Jakarta Sans**.

> This is a rewrite of a generic clinical-portal template, remapped onto this project's real product (dental caries detection, not oral cancer), real backend (`app.py`'s `/predict` endpoint, which already returns a final classification — not a raw score requiring client-side thresholding), and real database (the Supabase project already wired into `dental_rn_app`).

## BRAND & DESIGN SYSTEM

- **App Name:** DentalAI Portal
- **Tagline:** "AI Caries Detection & Clinical EHR"
- **Icon:** reuse the mobile app's 🦷 tooth mark — a rounded-16px badge with a dark navy/indigo gradient background and a glowing cyan tooth glyph. (No brand asset exists yet in this repo — either reuse an emoji-based mark like the mobile app does, or generate a `dentalai_icon.png` and drop it in `src/assets/`.)

**Color Palette (matches `dental_rn_app`'s existing design system — keep both clients visually consistent):**

Light mode:
- Primary Brand Indigo: `#4f46e5` (buttons/links) with gradient partner `#818cf8`
- Dark Navy Sidebar: `#1A2B4A`
- App Background: `#F0F4F8` (Soft Slate)
- Cards: `#FFFFFF`
- Secondary Cyan: `#06b6d4`
- Text Primary: `#0F172A`
- Text Secondary: `#475569`
- Text Muted: `#94A3B8`
- Urgent/Caries Red: `#DC2626` / bg `#FEF2F2` / border `#FECACA`
- Pending Amber: `#D97706` / bg `#FFFBEB` / border `#FEF3C7`
- Healthy/Cleared Green: `#16A34A` / bg `#F0FDF4` / border `#BBF7D0`

Dark mode overrides (this should be the **default** theme — it matches the mobile app exactly):
- `--bg-app`: `#090D16` (gradient to `#020617`, same as `dental_rn_app`'s `LinearGradient`)
- `--bg-card`: `rgba(255,255,255,0.04)` glass fill over the navy background, `rgba(255,255,255,0.08)` border
- `--border-color`: `rgba(255,255,255,0.08)`
- `--text-primary`: `#F3F4F6`
- Primary Indigo stays `#4f46e5` / `#818cf8`
- Secondary Cyan becomes `#06b6d4` / `#22d3ee`
- Success Green `#10b981`, Danger Red `#ef4444` / `#f87171`, Amber `#f59e0b` (exact hexes used in the mobile app's `styles`)

**Design Language:**
- Glassmorphism sidebar with semi-transparent dividers
- Rounded corners: 8px (sm), 14px (md), 20px (lg)
- Subtle, layered, medical-grade box shadows
- Animated micro-interactions on hover (`translateY(-1px)`)
- Clinical precision aesthetic — professional clinical staff UI, not consumer
- Light/Dark mode toggle in top bar, defaulting to dark

## LAYOUT ARCHITECTURE

Persistent layout:
- Left sidebar (280px, dark navy `#1A2B4A` / glass-on-navy in dark mode) — hidden on mobile, slides in from hamburger menu
- Main content area (flex-grow, scrollable)
- Top bar: page title, API status badge, theme toggle

Mobile (below 768px): sticky top header with hamburger + logo + page name; sidebar becomes a fixed-position slide-in overlay (`top: 60px`); full-width content panels.

**Sidebar contains:**
- Header: DentalAI icon + "DentalAI" app name + "Caries Detect" version tag
- Nav sections: "Main Dashboard", "Clinical Tools", "System"
- Nav items: Clinical Dashboard, Start Patient Screening, Patient Records, Caries Risk Questionnaire, Referral Directory, Dental Clinics & Labs, Clinical Guidelines, Portal Settings
- Footer: clinician avatar (2-letter initials circle) + "Dr. [WorkerID]" + "Dental Officer" role + Sign Out button

**Top bar contains:**
- Left: current page title
- Right: API status badge (green dot "API Connected" / grey dot "Standalone Demo Mode" — clickable to re-ping the Flask backend) + theme toggle

## PAGE 1: AUTHENTICATION SCREEN

Centered white/glass card (max-width 440px) when not logged in.

- DentalAI logo badge (72×72px, rounded-16)
- App name "DentalAI Portal" (24px, weight 800), subtitle "AI Caries Detection & Clinical EHR"
- Tab switcher: "Sign In" / "Create Account" (pill tabs)
- "Clinician License ID" text input (placeholder "e.g. DR_SEN", uppercased)
- "Secure Access PIN (Min. 4 digits)" numeric password input
- On Create Account: extra "Confirm PIN" field
- Red error box with `ShieldAlert` icon
- Submit: "Enter Clinical Portal" (primary indigo, full width, loading spinner while submitting)
- Hint: "Authorized Dental Clinicians Only. All screening activity is logged."

**Auth logic — localStorage only, matching this repo's existing pattern of keeping auth separate from clinical data (patients live in Supabase; login is a lightweight per-device gate):**
- `@dentalai_pin_{lowercaseWorkerId}` — stored PIN per clinician
- `@dentalai_worker_id` — current session
- Create Account registers a new PIN; Sign In verifies against the stored PIN; Sign Out clears `@dentalai_worker_id`

## PAGE 2: CLINICAL DASHBOARD (`dashboard`)

4 stat cards (responsive 4 → 2 → 1 column), sourced from the **Supabase `patients` table** (not localStorage):
- "Total Patients Screened" — row count — `Layers` icon
- "Urgent Care" — count where `badge = 'urgent'` — red — `ShieldAlert`
- "Pending Follow-up" — count where `badge = 'pending'` — amber — `AlertTriangle`
- "Healthy / Cleared" — count where `badge = 'cleared'` — green — `CheckCircle`

Below: 2-column action row.

**Left — Hero banner** (gradient `#4f46e5` → `#1A2B4A`):
- Title "Start Dental X-Ray Screening"
- Description of the dual-model pipeline: an X-ray validity check (MobileNetV2 + `xray_validator.h5`) followed by the caries classifier (`caries_model1.h5`)
- Button "Scan Patient X-Ray" (`FilePlus` icon) → Screening tab
- Decorative dashed-circle SVG with a tooth glyph in the crosshair

**Right — Quick Actions grid (2×2):**
- Caries Risk Profiler → risk tab
- Patient Records → records tab
- Referral Directory → specialists tab
- Dental Clinics & Labs → hospitals tab

**Recent Patient Screenings table** (last 4 `patient_history` rows joined to `patients`): Patient ID, Screening Date, Risk Triage (colored badge), Confidence %, Attending Clinician, "Triage Report" button.

If the `patients` table is empty, show a "Seed Sample Patients" action that inserts the same 3 demo rows already defined in `dental_rn_app/supabase/schema.sql` (Anjali Mishra / Ramesh Kumar / Suresh Sharma) — don't invent a separate local seed set, since this data is shared with the mobile app.

## PAGE 3: PATIENT SCREENING FLOW (`screening`) — 3-Step Flow

Step indicator: **1. Intake Consent → 2. Capture & Scan → 3. Diagnosis Report**

### STEP 1 — CONSENT
- Scrollable disclosure box: "DENTALAI CARIES EARLY-DETECTION SCREENING PROTOCOL DISCLOSURE" — purpose (AI-assisted caries screening from a dental X-ray), method (dual-model validation + classification), disclaimer (adjunct tool, not a diagnostic replacement — a licensed dentist must confirm findings), privacy note (data is stored in the clinic's Supabase project, shared with the mobile app)
- Patient ID field + "Auto-Generate ID" button, format `PT-XXXXX` (matches `dental_rn_app`'s `handleSaveNewPatient` ID scheme — **not** `OSCC-2026-XXXX`). If the entered ID matches an existing patient in Supabase, attach this screening to that patient; otherwise offer to register it as a new patient (same `patients` insert the mobile app performs).
- Consent checkbox: "I hereby verify patient understanding and active clinical consent."
- Digital signature pad: HTML5 canvas (700×150), placeholder text, mouse + touch drawing, "Clear Signature" button
- "Proceed" button, disabled until patient ID is filled, consent is checked, and a signature exists

### STEP 2 — SCAN
- Patient ID shown prominently in indigo
- Tab toggle: "Upload Local Photo" (`ImageIcon`) / "Web Camera Capture" (`Camera`)
- Upload: drag-and-drop + hidden `<input type="file" accept="image/*">`, preview on select
- Webcam: `navigator.mediaDevices.getUserMedia`, live feed with a scanning-grid overlay, large circular shutter button
- Once an image is ready: preview with a semi-transparent diagnostic grid overlay, an animated laser-scan sweep (CSS), a `Trash2` remove/retry button, and "Analyze X-Ray" primary button

**AI processing animation** (on Analyze) — stage text should reflect the *real* backend pipeline in `app.py`, run over ~3s:
1. "Verifying image integrity..." (10%)
2. "Checking for blank/low-contrast scans..." (25%)
3. "Loading MobileNetV2 feature extractor..." (40%)
4. "Running xray_validator.h5 — confirming valid dental X-ray..." (55%)
5. "Loading caries_model1.h5 classifier..." (70%)
6. "Extracting enamel density & demineralization features..." (85%)
7. "Calculating confidence score & clinical recommendation..." (95%)

Show a status card: CSS spinner + "AI Processing — X%" + current stage text.

**Triage logic — important difference from a generic template:** `app.py`'s `/predict` endpoint already performs the full pipeline server-side and returns a final `{ condition, extraction, confidence }` — there is no raw score to threshold client-side.

- **Live mode** (`useLiveApi = true` and the API is reachable): `POST` the image as `FormData` (`file`, `threshold` = the confidence slider value ÷ 100) to `{apiUrl}/predict`. Use the response directly — `condition` is already `"Caries Found"` or `"No Caries Detected"`.
- **Offline/demo mode:** run a client-side canvas heuristic as a stand-in — resize the image to 224×224 on a hidden canvas, count pixels in a brown/grey decay-color range (roughly `R 60–140, G 40–110, B 20–90`) versus bright enamel-white pixels, compute a density ratio, amplify it, and produce a demo confidence score between 0.02–0.99. Classify against the same `threshold` used by the live model.

Unlike a 3-tier "high/suspicious/normal" scheme, the real caries model is **binary** — "Caries Found" or "No Caries Detected". The Pending status on a patient record is a manually-set clinical follow-up flag, not an AI output — don't conflate the two.

### STEP 3 — RESULT
- Risk badge: "🦷 Caries Found" (red) or "✅ No Caries Detected" (green) — reuse exact copy/styling from `dental_rn_app`
- SVG circular gauge for confidence % (same technique as the mobile app: `Circle` with `strokeDasharray="251"`, `strokeDashoffset` driven by confidence)
- Recommendation text from the API's `extraction` field
- Extended explanation paragraph (distinct copy for each outcome)
- Buttons: "Generate Clinical Report" (opens modal), "New Screening Intake" (reset), **"Save to Patient EHR"** — inserts a `patient_history` row (and updates the patient's `status`/`badge`/`description`) in Supabase, exactly mirroring `handleSaveScanToEHR` in `dental_rn_app/App.js`, so the record shows up identically in the mobile app
- If Caries Found: extra row with "Refer to Specialist" and "Find Dental Clinic" buttons

## PAGE 4: PATIENT RECORDS (`records`)

Table backed by the **shared Supabase `patients` + `patient_history` tables** (not `localStorage`): Patient ID | Screening Date | Category (Optical X-Ray Scan / Risk Questionnaire) | Risk Level (badge) | Confidence | Attending Clinician | "Triage Report" button.

Header: "Registered Patient EHR Archive" + description. "Seed Sample Patients" button appears only if the table is empty (same demo rows as the Dashboard).

> Do **not** add a "Clear All Records" destructive action here the way a localStorage-only template would — this table is shared with the mobile app and other clinicians. If you want a destructive reset for demos, gate it behind a confirmation that makes the shared-data blast radius explicit.

## PAGE 5: CARIES RISK QUESTIONNAIRE (`risk`)

**Intro screen:** `ClipboardCheck` icon in a circular indigo-tinted background, title "Caries Risk Assessment", description, "Initiate Questionnaire" button.

**Questions (one at a time, progress bar 10% per question, "Question X of 10"):** each has 3 answer rows — "YES — Frequent/Severe" (×2), "SOMETIMES — Occasional" (×0.8), "NO — Never" (×0). Suggested question set (tune weights with an actual dentist before shipping):

1. Frequent sugary snacks or drinks between meals? (weight 4)
2. Brush teeth fewer than twice a day? (weight 3)
3. Rarely or never floss? (weight 2)
4. Dry mouth / reduced saliva (medication, mouth breathing)? (weight 3)
5. Visible white spots or discoloration on teeth? (weight 3.5)
6. Pain or sensitivity to hot/cold/sweet foods? (weight 3)
7. Little to no fluoride exposure (toothpaste/water)? (weight 2)
8. Deep pits/grooves or crowded, hard-to-clean teeth? (weight 2)
9. No dental check-up in over 12 months? (weight 2)
10. History of cavities or fillings in the last 2 years? (weight 3)

Score = sum(weight × multiplier), normalized to 100 against the max possible (~27.5).

**Result screen:** large circular score display, risk badge, description.
- Score ≥ 70 → "High Caries Risk" (red) — urgent hygiene intervention + clinical exam
- 40–70 → "Moderate Risk" (amber) — improve hygiene, monitor
- < 40 → "Low Risk" (green) — routine maintenance

Buttons: "Save Result to Patient Records" (writes a `patient_history` row flagged `is_questionnaire: true`) + "Restart Checklist".

## PAGE 6: REFERRAL DIRECTORY (`specialists`)

Search by name/clinic. 2-column grid of specialist cards: avatar initial, name, title, clinic (`MapPin`), phone (`PhoneCall`), email (`FileText`), "Generate Referral Letter" button (copies formatted text via `navigator.clipboard.writeText`, referencing the patient's caries diagnosis/confidence).

Suggested specialties (replace with a real referral network before shipping):
- Endodontist (Root Canal Specialist)
- Oral & Maxillofacial Surgeon
- Periodontist (Gum Specialist)
- Prosthodontist (Restorative Dentistry)

## PAGE 7: DENTAL CLINICS & LABS (`hospitals`)

Search by name/city. 2-column grid of clinic cards: name (indigo heading) + star-rating badge, address, feature tags as small pills (e.g. "Digital X-Ray", "CBCT Imaging", "Same-day Crowns", "Pediatric Dentistry"), phone, "Contact Clinic Helpline" (`tel:` link). Placeholder entries — swap in real partner clinics.

## PAGE 8: CLINICAL GUIDELINES (`guidelines`)

Static reference content, `Compass` icon header, 4 cards (2-col → 1-col mobile):
- "Clinician Visual & Radiographic Exam Steps"
- "High-Risk Lesion Profiles" — interproximal caries, occlusal pit/fissure caries, root caries, recurrent caries under restorations
- "Preventive Nutrition & Fluoride Guidance"
- "Patient Hygiene Protocol" — brushing/flossing/mouthwash schedule

## PAGE 9: PORTAL SETTINGS (`settings`)

Two-column grid.

**Left — "AI Processing Settings":**
- Checkbox: "Redirect predictions to the Flask ML server"
- Flask API URL input (default matches the mobile app's default, e.g. `http://localhost:5000`)
- "Ping Server" button (fetches the server root, shows success/fail)

**Right — "Change Portal PIN":** current PIN, new PIN, confirm new PIN, validation (min 4 digits, match, correct current PIN).

API connection: auto-ping every 15s in the background; topbar badge reflects reachability.

> Supabase connection (URL + anon key) is **build-time config**, not user-editable at runtime — same convention as `dental_rn_app`. Use Vite's public env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, loaded from a gitignored `.env` (with a checked-in `.env.example`). **Reuse the existing project** (`ymavwrmrawsjuuqfvtmf`) so patient data is shared with the mobile app — don't point this at a different Supabase project. Never put the `service_role` key in this app; it's a Vite app, so anything in `import.meta.env.VITE_*` ships to the browser.

## CLINICAL REPORT MODAL

Full-screen overlay (backdrop-blur), white/glass modal (max-width 800px, max-height 90vh, scrollable). Header: "DentalAI Clinical Diagnostic Report" + close button.

Body: Patient Demographics (ID, intake date, screening medium) + Clinician Details (name, "Dental Screening Department", clinic name) + captured X-ray thumbnail (if from an optical scan) + colored result box "AI Triage Classification" (condition + confidence, large colored text) + "Clinician Action & Recommendations" text + two signature boxes (patient consent signature image + clinician cursive signature) + disclaimer + "Print certified Triage Document" button (`window.print()`).

Also render a `display:none` printable-only div, shown only via `@media print`, formatted for A4.

## CSS ANIMATION & EFFECTS

Same techniques as the mobile app, recolored to the indigo/cyan/red/green/amber palette above (not blue/teal):
- Laser scanner sweep over the captured photo (CSS keyframes, ~1.5s loop)
- Scanning grid overlay (repeating linear-gradient, ~30px spacing, low opacity)
- Sidebar active nav item: white text + indigo left border + indigo-glow background
- Widget card hover: lift + shadow transition
- Buttons: hover `translateY(-1px)` + stronger shadow
- CSS spinner: rotating `border-top-color`

## STATE MANAGEMENT

React `useState` + two persistence layers — don't blur these:

**localStorage (per-device, non-clinical):**
- `@dentalai_worker_id` — current session
- `@dentalai_pin_{lowercaseId}` — per-clinician PIN
- `@dentalai_theme` — `"light"` / `"dark"`
- `@dentalai_api_url` — Flask server base URL
- `@dentalai_use_live_api` — `"true"`/`"false"`

**Supabase (shared clinical data, same project as `dental_rn_app`):**
- `patients` table
- `patient_history` table

## TECHNICAL REQUIREMENTS

- Framework: Vite + React (JSX), no TypeScript
- Icons: `lucide-react`
- Data: `@supabase/supabase-js`
- No router — single component with tab-based state navigation, matching the mobile app's `activeTab` pattern
- Vanilla CSS only (no Tailwind) — Google Fonts Outfit + Plus Jakarta Sans
- Build: `npm run build` → `dist/`, Netlify-compatible static hosting

## FILES STRUCTURE

```
web_app/
├── index.html              — SEO meta tags, favicon, title
├── .env.example             — VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY placeholders
├── src/
│   ├── main.jsx              — React root render
│   ├── App.jsx               — single-file application shell + tab routing
│   ├── App.css                — empty (cleared)
│   ├── index.css               — full design system (vanilla CSS)
│   ├── lib/
│   │   └── supabaseClient.js    — createClient(import.meta.env.VITE_SUPABASE_URL, ...VITE_SUPABASE_ANON_KEY)
│   └── assets/
│       └── dentalai_icon.png      — brand mark (create or reuse mobile app's tooth badge)
├── package.json
└── vite.config.js
```

## WHAT NOT TO CARRY OVER FROM A GENERIC TEMPLATE

- No second/separate Supabase project — reuse `ymavwrmrawsjuuqfvtmf` so mobile and web share one patient database.
- No `service_role` key anywhere in this app (Vite ships `VITE_*` env vars to the client bundle).
- No 3-tier high/suspicious/normal AI output — the real model is binary (Caries Found / No Caries Detected); keep "Pending" as a manual clinical status only.
- No client-side raw-score thresholding against the live API — `app.py` already returns a final classification.
