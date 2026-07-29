// Pulls real workflow-run history from the GitHub Actions API for Sheets 9
// (Execution History) and 10 (GitHub Actions Results) of the test
// management report — live data, not invented rows. Inside a GitHub Actions
// job, GITHUB_TOKEN and GITHUB_REPOSITORY are already set automatically
// (see .github/workflows/e2e-testing.yml's "Refresh GitHub Actions history"
// step); running this locally needs a GITHUB_TOKEN with at least
// `actions:read` and GITHUB_REPOSITORY=owner/repo set by hand.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUT_PATH = path.resolve(__dirname, '../testdata/github-actions-history.json');

function resolveRepoSlug() {
  if (process.env.GITHUB_REPOSITORY) return process.env.GITHUB_REPOSITORY;
  try {
    const remote = execSync('git config --get remote.origin.url', { cwd: path.resolve(__dirname, '../..') })
      .toString()
      .trim();
    const match = remote.match(/github\.com[:/]+([^/]+)\/([^/.]+?)(\.git)?$/);
    if (match) return `${match[1]}/${match[2]}`;
  } catch (err) {
    // fall through
  }
  return null;
}

async function fetchRuns(repoSlug, token) {
  const headers = { Accept: 'application/vnd.github+json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`https://api.github.com/repos/${repoSlug}/actions/runs?per_page=25`, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status}: ${await response.text()}`);
  }
  const body = await response.json();
  return body.workflow_runs || [];
}

async function main() {
  const repoSlug = resolveRepoSlug();
  if (!repoSlug) {
    console.warn('Could not resolve owner/repo (no GITHUB_REPOSITORY env var, no git remote). Writing an empty history file.');
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify([], null, 2));
    return;
  }

  try {
    const runs = await fetchRuns(repoSlug, process.env.GITHUB_TOKEN);
    const simplified = runs.map((r) => ({
      workflowName: r.name,
      runId: r.id,
      commitId: r.head_sha,
      branch: r.head_branch,
      executionDate: r.run_started_at,
      status: r.conclusion || r.status,
      htmlUrl: r.html_url,
      artifactsUrl: r.artifacts_url,
      event: r.event,
      durationSeconds: r.updated_at && r.run_started_at
        ? Math.round((new Date(r.updated_at) - new Date(r.run_started_at)) / 1000)
        : null,
    }));
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify(simplified, null, 2));
    console.log(`Fetched ${simplified.length} workflow runs for ${repoSlug} -> ${path.relative(process.cwd(), OUT_PATH)}`);
  } catch (err) {
    console.warn(`Could not fetch GitHub Actions history (${err.message}). Report generator will fall back to any previously-saved snapshot.`);
  }
}

main();
