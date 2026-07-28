# Testing & CI Overview

This folder holds the automated test suites referenced by `.github/workflows/`.

## Workflows

| Workflow | File | What it does |
|---|---|---|
| Selenium E2E | `.github/workflows/selenium-e2e.yml` | Exports the web build, serves it locally, runs `testing/selenium` against it |
| Security & Vulnerability | `.github/workflows/security-vulnerability.yml` | Secret scanning (gitleaks, blocking) + dependency audit (npm audit / pip-audit, report-only) |

## Selenium E2E (`testing/selenium/`)

Real Selenium WebDriver tests against the static web export — no Supabase credentials needed, since they only cover public marketing pages + login/signup rendering.

Run locally:
```bash
cd dental_rn_app
npm ci
npx expo export --platform web
npx serve dist -l 8080 &
cd ../testing/selenium
pip install -r requirements.txt
BASE_URL=http://localhost:8080 pytest -v
```

**Currently covers:** Home, About, Features, Contact, AI Technology, Login, Signup, and one click-through navigation test (9 tests).

**Not yet covered** (needs a seeded Supabase test account to test safely in CI): authenticated portal screens — Dashboard, Scan, Patients, Appointments, Settings, and the Dashboard detail pages.

## Dependency Audit Policy

As of this writing, `npm audit` on `dental_rn_app` reports 22 findings (2 critical, 7 high, 12 moderate, 1 low). All of them are in **Expo/Metro build-tooling** transitive dependencies (babel, postcss, js-yaml, brace-expansion, form-data, shell-quote) — none are in code that ships to end users, and several have no non-breaking fix available yet (`npm audit fix --force` would force a breaking Expo SDK upgrade).

For this reason, `dependency-audit` is **report-only**: it always completes and writes full findings to the GitHub Actions job summary, but doesn't fail the build on these pre-existing, tooling-only findings. Secret scanning (`secret-scan`) is a **real blocking gate** — it should legitimately stay green, since no `.env` or credential has ever been committed to this repo.

**Recommendation:** periodically check `npm audit` after routine `expo` SDK upgrades — newer Expo releases typically pull in patched versions of these same transitive dependencies.
