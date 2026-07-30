// Merges results from the three independent test runners (Mocha/mochawesome
// for mobile UI, pytest-json-report for API + database) into one
// stakeholder-facing workbook. Each input is optional so this still produces
// a useful report if, say, the mobile suite didn't run in a given CI job.
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.resolve(__dirname, '../reports');
const OUTPUT_PATH = path.resolve(__dirname, '../excel/Mobile_E2E_Test_Report.xlsx');

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.warn(`Could not parse ${filePath}: ${err.message}`);
    return null;
  }
}

function loadMochawesome() {
  const data = readJsonIfExists(path.join(REPORTS_DIR, 'mochawesome', 'mochawesome.json'));
  if (!data) return [];
  const rows = [];
  const walk = (suite, moduleName) => {
    const name = suite.title || moduleName;
    (suite.tests || []).forEach((t) => {
      rows.push({
        module: name || 'Mobile',
        scenario: t.title,
        frontendStatus: t.state === 'passed' ? 'PASS' : t.state === 'failed' ? 'FAIL' : 'SKIPPED',
        backendStatus: 'N/A',
        databaseStatus: 'N/A',
        result: t.state,
        failureReason: t.err && t.err.message,
        duration: t.duration,
      });
    });
    (suite.suites || []).forEach((child) => walk(child, name));
  };
  (data.results || []).forEach((r) => walk(r, r.title));
  return rows;
}

function loadPytestJson(fileName, moduleLabel, statusColumn) {
  const data = readJsonIfExists(path.join(REPORTS_DIR, fileName));
  if (!data || !data.tests) return [];
  return data.tests.map((t) => ({
    module: moduleLabel,
    scenario: t.nodeid,
    frontendStatus: 'N/A',
    backendStatus: statusColumn === 'backend' ? (t.outcome === 'passed' ? 'PASS' : t.outcome.toUpperCase()) : 'N/A',
    databaseStatus: statusColumn === 'database' ? (t.outcome === 'passed' ? 'PASS' : t.outcome.toUpperCase()) : 'N/A',
    result: t.outcome,
    failureReason: t.call && t.call.longrepr,
    duration: (t.call && t.call.duration) || 0,
  }));
}

function loadApiResults() {
  // Written by api-tests/conftest.py's request logger fixture — one JSON
  // line per HTTP call made during the run, independent of pass/fail.
  const filePath = path.join(REPORTS_DIR, 'api-call-log.json');
  const data = readJsonIfExists(filePath);
  return Array.isArray(data) ? data : [];
}

async function buildReport() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Dental-App QA Automation Framework';
  workbook.created = new Date();

  const mobileRows = loadMochawesome();
  const apiTestRows = loadPytestJson('api-report.json', 'API', 'backend');
  const dbTestRows = loadPytestJson('database-report.json', 'Database', 'database');
  const allTestRows = [...mobileRows, ...apiTestRows, ...dbTestRows];
  const apiCallRows = loadApiResults();

  const total = allTestRows.length;
  const passed = allTestRows.filter((r) => r.result === 'passed' || r.result === 'PASS').length;
  const failed = allTestRows.filter((r) => r.result === 'failed' || r.result === 'FAIL').length;
  const durationSeconds = allTestRows.reduce((sum, r) => sum + (Number(r.duration) || 0), 0);

  // ---- Summary ----
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Execution Date', key: 'date', width: 22 },
    { header: 'Environment', key: 'env', width: 16 },
    { header: 'Device', key: 'device', width: 20 },
    { header: 'Total Tests', key: 'total', width: 14 },
    { header: 'Passed', key: 'passed', width: 12 },
    { header: 'Failed', key: 'failed', width: 12 },
    { header: 'Pass Percentage', key: 'passPct', width: 16 },
    { header: 'Duration', key: 'duration', width: 14 },
  ];
  summarySheet.addRow({
    date: new Date().toISOString(),
    env: process.env.REPORT_ENV_LABEL || 'local',
    device: process.env.DEVICE_NAME || 'n/a',
    total,
    passed,
    failed,
    passPct: total ? `${((passed / total) * 100).toFixed(1)}%` : 'n/a',
    duration: `${durationSeconds.toFixed(1)}s`,
  });
  summarySheet.getRow(1).font = { bold: true };

  // ---- Test Cases ----
  const testCasesSheet = workbook.addWorksheet('Test Cases');
  testCasesSheet.columns = [
    { header: 'Test ID', key: 'id', width: 10 },
    { header: 'Module', key: 'module', width: 18 },
    { header: 'Scenario', key: 'scenario', width: 50 },
    { header: 'Frontend Status', key: 'frontendStatus', width: 16 },
    { header: 'Backend Status', key: 'backendStatus', width: 16 },
    { header: 'Database Status', key: 'databaseStatus', width: 16 },
    { header: 'Result', key: 'result', width: 12 },
  ];
  testCasesSheet.getRow(1).font = { bold: true };
  allTestRows.forEach((row, idx) => {
    testCasesSheet.addRow({
      id: `TC-${String(idx + 1).padStart(3, '0')}`,
      module: row.module,
      scenario: row.scenario,
      frontendStatus: row.frontendStatus,
      backendStatus: row.backendStatus,
      databaseStatus: row.databaseStatus,
      result: row.result,
    });
  });

  // ---- API Results ----
  const apiSheet = workbook.addWorksheet('API Results');
  apiSheet.columns = [
    { header: 'API Name', key: 'name', width: 24 },
    { header: 'Request', key: 'request', width: 40 },
    { header: 'Response', key: 'response', width: 40 },
    { header: 'Status Code', key: 'statusCode', width: 14 },
    { header: 'Execution Time', key: 'durationMs', width: 16 },
  ];
  apiSheet.getRow(1).font = { bold: true };
  apiCallRows.forEach((call) => {
    apiSheet.addRow({
      name: call.name,
      request: JSON.stringify(call.request || {}).slice(0, 500),
      response: JSON.stringify(call.response || {}).slice(0, 500),
      statusCode: call.statusCode,
      durationMs: call.durationMs,
    });
  });

  // ---- Failed Tests ----
  const failedSheet = workbook.addWorksheet('Failed Tests');
  failedSheet.columns = [
    { header: 'Test Name', key: 'name', width: 45 },
    { header: 'Failure Reason', key: 'reason', width: 50 },
    { header: 'Screenshot', key: 'screenshot', width: 40 },
    { header: 'Logs', key: 'logs', width: 30 },
    { header: 'Stack Trace', key: 'stack', width: 60 },
  ];
  failedSheet.getRow(1).font = { bold: true };
  allTestRows
    .filter((r) => r.result === 'failed' || r.result === 'FAIL')
    .forEach((row) => {
      failedSheet.addRow({
        name: row.scenario,
        reason: (row.failureReason || '').toString().slice(0, 300),
        screenshot: row.screenshot || 'see reports/failures/',
        logs: 'logs/failures.log',
        stack: (row.failureReason || '').toString().slice(0, 1000),
      });
    });

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  await workbook.xlsx.writeFile(OUTPUT_PATH);
  console.log(`Excel report written to ${OUTPUT_PATH} (${total} tests, ${passed} passed, ${failed} failed)`);

  const apiDbReportPath = path.resolve(__dirname, '../excel/API_Database_Test_Report.xlsx');
  if (OUTPUT_PATH !== apiDbReportPath) {
    await workbook.xlsx.writeFile(apiDbReportPath);
    console.log(`Excel report copy written to ${apiDbReportPath}`);
  }
}

if (require.main === module) {
  buildReport().catch((err) => {
    console.error('Failed to build Excel report:', err);
    process.exit(1);
  });
}

module.exports = { buildReport };
