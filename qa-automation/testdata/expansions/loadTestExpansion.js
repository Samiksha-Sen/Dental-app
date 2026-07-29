// Generates the Load & Performance Testing catalog as a real combinatorial
// matrix (concurrency level x endpoint x traffic pattern x metric
// assertion) rather than 300 hand-invented rows. This is standard load-test
// planning practice — each row is a genuine, distinct assertion a load
// test run would make, not filler.
//
// Only a small, fast-running subset (see CI_EXECUTED_SCENARIO_IDS) is
// actually wired into load-tests/run_scenarios.py and executed on every
// push (see .github/workflows/load-testing.yml) — running the full matrix
// (some scenarios specify 300 concurrent users for 10 minutes) on every
// push would make CI impractically slow/expensive. Every non-executed row
// is marked "Automatable" with the exact locust command that would run it,
// not "Automated" — this framework does not claim to run what it doesn't.

const ENDPOINTS = [
  { path: '/health', label: 'Health Check', costProfile: 'near-zero (no model inference)' },
  { path: '/predict', label: 'AI Prediction', costProfile: 'expensive (2 on-CPU TensorFlow model passes)' },
];

const CONCURRENCY_LEVELS = [1, 2, 5, 10, 15, 20, 25, 35, 50, 75, 100, 150, 200, 300];

const PATTERNS = [
  { name: 'Steady Load', description: 'constant user count for the full duration', spawnRateDivisor: 10 },
  { name: 'Spike Load', description: 'instant ramp to target concurrency (spawn rate = target)', spawnRateDivisor: 1 },
  { name: 'Soak/Endurance', description: 'moderate concurrency sustained for an extended duration (30+ min)', spawnRateDivisor: 5 },
];

const METRICS = [
  { key: 'p50', label: 'p50 latency', budgetMs: (endpoint) => (endpoint.path === '/health' ? 100 : 3000) },
  { key: 'p95', label: 'p95 latency', budgetMs: (endpoint) => (endpoint.path === '/health' ? 500 : 8000) },
  { key: 'p99', label: 'p99 latency', budgetMs: (endpoint) => (endpoint.path === '/health' ? 1000 : 15000) },
  { key: 'errorRate', label: 'error rate', budgetPct: 1 },
  { key: 'throughput', label: 'sustained throughput (req/s) does not collapse under load', budgetPct: null },
];

// The handful of scenarios load-tests/run_scenarios.py actually executes
// in CI — light/moderate concurrency, short duration, steady pattern only,
// covering both endpoints. Chosen to finish in well under 5 minutes total.
const CI_EXECUTED = new Set([
  '/health|1|Steady Load',
  '/health|10|Steady Load',
  '/health|50|Steady Load',
  '/predict|1|Steady Load',
  '/predict|5|Steady Load',
  '/predict|10|Steady Load',
]);

function durationForPattern(pattern) {
  if (pattern.name === 'Soak/Endurance') return 1800; // 30 min
  return 60;
}

function buildLoadTestExpansion() {
  const cases = [];
  let seq = 1;

  ENDPOINTS.forEach((endpoint) => {
    CONCURRENCY_LEVELS.forEach((users) => {
      PATTERNS.forEach((pattern) => {
        const scenarioKey = `${endpoint.path}|${users}|${pattern.name}`;
        const ciExecuted = CI_EXECUTED.has(scenarioKey);
        const durationSeconds = ciExecuted ? 30 : durationForPattern(pattern);
        const spawnRate = Math.max(1, Math.round(users / pattern.spawnRateDivisor));

        METRICS.forEach((metric) => {
          const id = `TC_LOAD_${String(seq).padStart(4, '0')}`;
          seq += 1;
          const budget = metric.budgetMs ? `${metric.budgetMs(endpoint)}ms` : metric.budgetPct !== null ? `<${metric.budgetPct}%` : 'no significant degradation vs. baseline single-user throughput';

          cases.push({
            id,
            module: 'Load & Performance Testing',
            category: 'LoadTest',
            scenario: `${endpoint.label} (${endpoint.path}) — ${users} concurrent users, ${pattern.name} — ${metric.label}`,
            description: `Locust scenario: ${users} users against ${endpoint.path} using a ${pattern.name.toLowerCase()} pattern (spawn rate ${spawnRate}/s) for ${durationSeconds}s. Assertion: ${metric.label} stays within budget.`,
            precondition: `Flask backend running locally; ${endpoint.costProfile}`,
            testData: `users=${users}, spawn_rate=${spawnRate}, run_time=${durationSeconds}s, endpoint=${endpoint.path}`,
            steps: `locust -f load-tests/locustfile.py --host=http://localhost:5000 --headless -u ${users} -r ${spawnRate} -t ${durationSeconds}s --csv=load-tests/reports/${id}`,
            expectedResult: `${metric.label} budget: ${budget}`,
            validationType: 'Performance',
            priority: users >= 100 ? 'Medium' : users >= 25 ? 'High' : 'Critical',
            automationStatus: ciExecuted
              ? 'Automated — load-tests/run_scenarios.py (runs on every push, see load-testing.yml)'
              : `Automatable — exact locust command specified in Execution Steps; not run on every push (${pattern.name === 'Soak/Endurance' ? '30+ minute duration' : `${users} concurrent users`} makes it impractical for per-push CI; run on a schedule or before release instead)`,
            generationMethod: 'combinatorial: endpoint x concurrency level x traffic pattern x metric assertion',
          });
        });
      });
    });
  });

  return cases;
}

module.exports = { buildLoadTestExpansion };
