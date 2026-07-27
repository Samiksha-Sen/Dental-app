# DentalAI — Clinical Diagnostic Network

An AI-assisted dental X-ray diagnostic system: a Flask ML API that detects caries from X-ray images, and a React Native/Expo mobile app doctors use to scan patients, review AI predictions, and manage patient EHR records.

## Architecture

```
dental_rn_app/  (React Native / Expo — active mobile app)
      |
      |  POST /predict (X-ray image)
      v
app.py           (Flask ML API — caries detection + X-ray validation)
      |
      |  patient CRUD, read/write directly
      v
Supabase (Postgres)  — patients + patient_history tables
```

- **`app.py`** — Flask backend. Two ML models: a MobileNetV2-based classifier that validates an uploaded image actually *is* a dental X-ray (rejects blank/corrupt/non-X-ray uploads), and a caries-detection model (`caries_model1.h5`) that scores the X-ray and returns a condition, confidence %, and recommended next step. Also serves a static web page (`templates/index.html`) as a browser-based demo of the same flow. No database — images are processed in-memory/on-disk temporarily and deleted after prediction.
- **`dental_rn_app/`** — the active mobile app (Expo/React Native). Tabs: Dashboard, Scan (upload/capture X-ray → calls Flask `/predict`), Patients (EHR directory), Chat (AI assistant companion), Settings. Patient data is stored in **Supabase** (see below) rather than on-device only.
- **`dental_ai_app/`** — an earlier Flutter prototype of the mobile app, superseded by `dental_rn_app`. Not under active development.

## Data: Supabase

Patient records and diagnostic history live in Supabase Postgres, set up via [dental_rn_app/supabase/schema.sql](dental_rn_app/supabase/schema.sql):

- `patients` — id, patient_code (e.g. `PT-49201`), name, status, badge, description
- `patient_history` — per-patient timeline entries (registration, scans, checkups), linked via `patient_id`

The RN app reads/writes Supabase directly using `@supabase/supabase-js` and the project's anon key (`dental_rn_app/lib/supabaseClient.js`), governed by Row Level Security policies on the tables. Auth is currently mocked in the app (no real login yet), so RLS policies are permissive — see the note at the top of `schema.sql` for how to lock this down once real Supabase Auth is added.

## Running locally

**Backend:**
```
pip install -r requirements.txt
python app.py          # serves on http://localhost:5000
```

**Mobile app:**
```
cd dental_rn_app
npm install
npx expo start
```
Point the app at your Flask instance via the "Keras API Endpoint URL" field in Settings (defaults to `http://172.23.50.25:5000/predict` for local network testing, `http://localhost:5000/predict` on web).

Supabase connection is configured via `dental_rn_app/.env` (see `.env.example`).

## Deployment

- Backend deploys via `Procfile` (`gunicorn`-ready) — currently targeting Railway (see the default API URL in Settings).
- Mobile app builds via EAS (`eas.json`, `app.json`).
