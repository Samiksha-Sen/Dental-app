// Runs the real npm audit / pip-audit tools and saves a snapshot
// (testdata/dependency-audit-snapshot.json) that vulnerabilityExpansion.js
// turns into one catalog row per real finding. Live data, same pattern as
// fetchGithubActionsHistory.js — not a hardcoded vulnerability list.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const OUT_PATH = path.resolve(__dirname, '../testdata/dependency-audit-snapshot.json');

function safeExec(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, maxBuffer: 20 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  } catch (err) {
    // npm audit / pip-audit exit non-zero when vulnerabilities are found —
    // that's the normal case, not a failure to capture output.
    return (err.stdout || '').toString();
  }
}

function fetchNpmAudit() {
  const raw = safeExec('npm audit --json', path.join(ROOT, 'dental_rn_app'));
  try {
    const data = JSON.parse(raw);
    return Object.values(data.vulnerabilities || {}).map((v) => ({
      package: v.name,
      severity: v.severity,
      isDirect: !!v.isDirect,
      range: v.range,
      advisories: (v.via || []).filter((x) => typeof x === 'object').map((x) => ({
        title: x.title,
        url: x.url,
        severity: x.severity,
        cwe: x.cwe || [],
      })),
    }));
  } catch (err) {
    console.warn(`Could not parse npm audit output: ${err.message}`);
    return [];
  }
}

function fetchPipAudit() {
  const raw = safeExec('python -m pip_audit -r requirements.txt -f json', ROOT);
  try {
    const data = JSON.parse(raw);
    return (data.dependencies || [])
      .filter((d) => (d.vulns || []).length > 0)
      .map((d) => ({
        package: d.name,
        version: d.version,
        vulnerabilities: d.vulns.map((v) => ({ id: v.id, fixVersions: v.fix_versions || [], description: v.description })),
      }));
  } catch (err) {
    console.warn(`Could not parse pip-audit output (or none found): ${err.message}`);
    return [];
  }
}

function main() {
  const npm = fetchNpmAudit();
  const pip = fetchPipAudit();
  const snapshot = { fetchedAt: new Date().toISOString(), npm, pip };
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(snapshot, null, 2));
  console.log(`Dependency audit snapshot: ${npm.length} npm findings, ${pip.length} pip findings -> ${path.relative(process.cwd(), OUT_PATH)}`);
}

main();
