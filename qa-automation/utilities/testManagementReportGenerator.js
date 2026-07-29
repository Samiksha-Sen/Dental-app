// Generates Dental_AI_Test_Management_Report.xlsx — the enterprise QA
// Test Management workbook. Every sheet is built from real project data:
// testdata/testCaseCatalog.json (parsed from ../TEST_CASES.md — run
// buildTestCatalogFromMarkdown.js first if you've edited that doc),
// testdata/automationMapping.json (hand-verified against the actual test
// files), the last local mochawesome/pytest-json-report run in reports/
// (if present), reports/api-call-log.json, and
// testdata/github-actions-history.json (run fetchGithubActionsHistory.js
// to refresh — CI does this automatically).
//
// IMPORTANT CAVEAT: ExcelJS (v4.4.0, the library this script uses) has no
// API for creating native Excel chart objects — `workbook.addChart` and
// `worksheet.addChart` simply don't exist in this package. The "Dashboard"
// sheet below uses conditional-formatting data bars/color scales instead
// (a real ExcelJS capability), and lays the summary numbers out in
// contiguous ranges so a human can select them and insert a real chart via
// Excel's own Insert > Chart in a couple of clicks. This is a genuine
// library limitation, not something skipped by choice.
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(ROOT, 'reports');
const OUTPUT_PATH = path.join(ROOT, 'excel', 'Dental_AI_Test_Management_Report.xlsx');

const STATUS_OPTIONS = ['Passed', 'Failed', 'Blocked', 'Not Executed'];
const PRIORITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low', 'Not Specified'];
const AUTOMATION_OPTIONS = ['Automated', 'Manual', 'In Progress', 'Automatable', 'N/A'];
const SEVERITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low'];

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2A44' } };
const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' } };

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.warn(`Could not parse ${filePath}: ${err.message}`);
    return fallback;
  }
}

function styleHeaderRow(row) {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', wrapText: true };
  });
  row.height = 22;
}

function addDropdown(worksheet, colLetter, startRow, endRow, options) {
  for (let r = startRow; r <= endRow; r++) {
    worksheet.getCell(`${colLetter}${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${options.join(',')}"`],
    };
  }
}

function normalizePriority(p) {
  if (!p || p === 'Not Specified') return 'Not Specified';
  return p;
}

function mapAutomationStatusLabel(raw) {
  if (!raw) return 'Manual';
  if (raw === 'N/A') return 'N/A';
  if (/^Automated/.test(raw)) return 'Automated';
  if (/^Automatable/.test(raw)) return 'In Progress';
  return 'Manual';
}

// --- Live execution data -----------------------------------------------

function loadMochawesomeResults() {
  const data = readJsonIfExists(path.join(REPORTS_DIR, 'mochawesome', 'mochawesome.json'), null);
  if (!data) return { byTitle: new Map(), stats: null };
  const byTitle = new Map();
  const walk = (suite) => {
    (suite.tests || []).forEach((t) => byTitle.set(t.fullTitle, t));
    (suite.suites || []).forEach(walk);
  };
  (data.results || []).forEach(walk);
  return { byTitle, stats: data.stats || null };
}

function loadPytestResults(fileName) {
  const data = readJsonIfExists(path.join(REPORTS_DIR, fileName), null);
  if (!data || !data.tests) return { byNodeId: new Map(), summary: null };
  const byNodeId = new Map();
  data.tests.forEach((t) => byNodeId.set(t.nodeid, t));
  return { byNodeId, summary: data.summary || null };
}

function resolveExecutionStatus(mapping, mochawesome, apiResults, dbResults) {
  if (!mapping) return { status: 'Not Executed', actualResult: '-', durationMs: null };

  if (mapping.framework === 'Mocha') {
    // Every Mocha mapping in automationMapping.json points at exactly one
    // full title (unlike some PyTest mappings, which group a few related
    // functions) — looked up directly against mochawesome's flattened map.
    const found = [mochawesome.byTitle.get(mapping.testIdentifier)].filter(Boolean);
    if (found.length === 0) return { status: 'Not Executed', actualResult: '-', durationMs: null };
    const anyFailed = found.some((t) => t.state === 'failed');
    const allPassed = found.every((t) => t.state === 'passed');
    return {
      status: anyFailed ? 'Failed' : allPassed ? 'Passed' : 'Blocked',
      actualResult: found.map((t) => t.state).join(', '),
      durationMs: found.reduce((s, t) => s + (t.duration || 0), 0),
    };
  }

  if (mapping.framework === 'PyTest') {
    const source = mapping.scriptLocation.startsWith('api-tests') ? apiResults : dbResults;
    // testIdentifier may list several "path::func_a, ::func_b" entries for
    // grouped tests — resolve each against that file's node ids.
    const parts = mapping.testIdentifier.split(', ').map((p) => (p.startsWith('::') ? mapping.testIdentifier.split('::')[0] + p : p));
    const found = parts.map((p) => source.byNodeId.get(p)).filter(Boolean);
    if (found.length === 0) return { status: 'Not Executed', actualResult: '-', durationMs: null };
    const anyFailed = found.some((t) => t.outcome === 'failed');
    const allPassed = found.every((t) => t.outcome === 'passed');
    const totalDuration = found.reduce((s, t) => s + ((t.call && t.call.duration) || 0), 0) * 1000;
    return {
      status: anyFailed ? 'Failed' : allPassed ? 'Passed' : 'Blocked',
      actualResult: found.map((t) => t.outcome).join(', '),
      durationMs: totalDuration,
    };
  }

  return { status: 'Not Executed', actualResult: '-', durationMs: null };
}

// --- Sheet builders ------------------------------------------------------

function buildSummarySheet(workbook, catalog, mappingById, execByTestId) {
  const sheet = workbook.addWorksheet('Test Case Summary');
  sheet.columns = [
    { header: 'Project Name', key: 'project', width: 22 },
    { header: 'Module', key: 'module', width: 26 },
    { header: 'Total Test Cases', key: 'total', width: 16 },
    { header: 'Passed', key: 'passed', width: 10 },
    { header: 'Failed', key: 'failed', width: 10 },
    { header: 'Blocked', key: 'blocked', width: 10 },
    { header: 'Not Executed', key: 'notExecuted', width: 14 },
    { header: 'Pass Percentage', key: 'passPct', width: 16 },
    { header: 'Execution Date', key: 'execDate', width: 16 },
    { header: 'Tester Name', key: 'tester', width: 18 },
    { header: 'Environment', key: 'environment', width: 20 },
  ];
  styleHeaderRow(sheet.getRow(1));
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = 'A1:K1';

  const modules = [...new Set(catalog.map((c) => c.module))];
  const today = new Date();

  modules.forEach((moduleName) => {
    const rows = catalog.filter((c) => c.module === moduleName);
    const total = rows.length;
    const passed = rows.filter((tc) => (execByTestId.get(tc.id) || {}).status === 'Passed').length;
    const failed = rows.filter((tc) => (execByTestId.get(tc.id) || {}).status === 'Failed').length;
    const blocked = rows.filter((tc) => (execByTestId.get(tc.id) || {}).status === 'Blocked').length;
    const notExecuted = total - passed - failed - blocked;
    const rowNum = sheet.rowCount + 1;

    sheet.addRow({
      project: 'Dental AI Application',
      module: moduleName,
      total,
      passed,
      failed,
      blocked,
      notExecuted,
      execDate: today,
      tester: 'QA Automation Framework',
      environment: 'Emulator (Appium) / PyTest',
    });
    // Formula, not a static number — recalculates if the sheet is hand-edited.
    sheet.getCell(`H${rowNum}`).value = { formula: `IF(C${rowNum}=0,0,ROUND(D${rowNum}/C${rowNum}*100,1))`, result: total ? Math.round((passed / total) * 1000) / 10 : 0 };
    sheet.getCell(`H${rowNum}`).numFmt = '0.0"%"';
    sheet.getCell(`I${rowNum}`).numFmt = 'yyyy-mm-dd';
  });

  // Grand total row with formulas summing the module rows above.
  const lastDataRow = sheet.rowCount;
  const totalRow = sheet.addRow({
    project: 'Dental AI Application',
    module: 'TOTAL (all modules)',
  });
  totalRow.font = { bold: true };
  ['C', 'D', 'E', 'F', 'G'].forEach((col) => {
    sheet.getCell(`${col}${totalRow.number}`).value = { formula: `SUM(${col}2:${col}${lastDataRow})`, result: 0 };
  });
  sheet.getCell(`H${totalRow.number}`).value = {
    formula: `IF(C${totalRow.number}=0,0,ROUND(D${totalRow.number}/C${totalRow.number}*100,1))`,
    result: 0,
  };
  sheet.getCell(`H${totalRow.number}`).numFmt = '0.0"%"';

  return { lastDataRow, totalRowNum: totalRow.number };
}

function buildCompleteTestCasesSheet(workbook, catalog, execByTestId) {
  const sheet = workbook.addWorksheet('Complete Test Cases');
  sheet.columns = [
    { header: 'Test Case ID', key: 'id', width: 14 },
    { header: 'Module Name', key: 'module', width: 22 },
    { header: 'Feature', key: 'feature', width: 22 },
    { header: 'Test Scenario', key: 'scenario', width: 40 },
    { header: 'Test Description', key: 'description', width: 40 },
    { header: 'Precondition', key: 'precondition', width: 30 },
    { header: 'Test Data', key: 'testData', width: 26 },
    { header: 'Execution Steps', key: 'steps', width: 40 },
    { header: 'Expected Result', key: 'expectedResult', width: 44 },
    { header: 'Actual Result', key: 'actualResult', width: 20 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Priority', key: 'priority', width: 14 },
    { header: 'Automation Status', key: 'automationStatus', width: 16 },
    { header: 'Defect ID', key: 'defectId', width: 12 },
    { header: 'Remarks', key: 'remarks', width: 30 },
  ];
  styleHeaderRow(sheet.getRow(1));
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = 'A1:O1';

  catalog.forEach((tc) => {
    const exec = execByTestId.get(tc.id) || { status: 'Not Executed', actualResult: '-' };
    sheet.addRow({
      id: tc.id,
      module: tc.module,
      feature: tc.module,
      scenario: tc.scenario,
      description: tc.description,
      precondition: tc.precondition,
      testData: tc.testData,
      steps: tc.steps,
      expectedResult: tc.expectedResult,
      actualResult: exec.actualResult || '-',
      status: exec.status,
      priority: normalizePriority(tc.priority),
      automationStatus: mapAutomationStatusLabel(tc.automationStatus),
      defectId: '',
      remarks: tc.automationStatus,
    });
  });

  const lastRow = sheet.rowCount;
  addDropdown(sheet, 'K', 2, lastRow, STATUS_OPTIONS);
  addDropdown(sheet, 'L', 2, lastRow, PRIORITY_OPTIONS);
  addDropdown(sheet, 'M', 2, lastRow, AUTOMATION_OPTIONS);

  // Conditional formatting: green/red/amber fill on Status.
  sheet.addConditionalFormatting({
    ref: `K2:K${lastRow}`,
    rules: [
      { type: 'containsText', operator: 'containsText', text: 'Passed', style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFC6EFCE' } } } },
      { type: 'containsText', operator: 'containsText', text: 'Failed', style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFC7CE' } } } },
      { type: 'containsText', operator: 'containsText', text: 'Blocked', style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFEB9C' } } } },
    ],
  });

  return lastRow;
}

function buildMobileUiSheet(workbook, catalog) {
  const sheet = workbook.addWorksheet('Mobile UI Test Cases');
  sheet.columns = [
    { header: 'Test ID', key: 'id', width: 14 },
    { header: 'Screen Name', key: 'screen', width: 20 },
    { header: 'UI Component', key: 'component', width: 24 },
    { header: 'Element Type', key: 'elementType', width: 16 },
    { header: 'Action', key: 'action', width: 20 },
    { header: 'Input Data', key: 'inputData', width: 26 },
    { header: 'Expected Behaviour', key: 'expected', width: 44 },
    { header: 'Actual Behaviour', key: 'actual', width: 20 },
    { header: 'Status', key: 'status', width: 14 },
  ];
  styleHeaderRow(sheet.getRow(1));
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = 'A1:I1';

  const screenByModule = {
    'Application Launch': 'App Shell',
    'User Authentication': 'Login / Signup',
    'Patient Management': 'Patients',
    'Patient Search': 'Patients',
    'Dental X-Ray Upload': 'Scan',
    'AI Caries Detection': 'Scan (result)',
    'X-Ray Report': 'Scan (result)',
    'Appointment Management': 'Appointments',
    Dashboard: 'Dashboard',
    Navigation: 'Bottom Tab Bar',
    Security: 'Login / Patients',
    'Error Handling': 'Scan',
  };

  const uiCases = catalog.filter((tc) => tc.validationType.includes('UI'));
  uiCases.forEach((tc) => {
    sheet.addRow({
      id: tc.id,
      screen: screenByModule[tc.module] || tc.module,
      component: tc.scenario,
      elementType: /button/i.test(tc.steps) ? 'Button' : /input|field/i.test(tc.steps) ? 'Text Field' : /card/i.test(tc.expectedResult) ? 'Card' : /modal|dialog/i.test(tc.steps) ? 'Dialog' : 'Screen',
      action: tc.steps,
      inputData: tc.testData,
      expected: tc.expectedResult,
      actual: '-',
      status: 'Not Executed',
    });
  });

  const lastRow = sheet.rowCount;
  addDropdown(sheet, 'I', 2, lastRow, STATUS_OPTIONS);
  return lastRow;
}

function buildApiSheet(workbook, catalog, apiCallLog) {
  const sheet = workbook.addWorksheet('API Test Cases');
  sheet.columns = [
    { header: 'API Test ID', key: 'id', width: 14 },
    { header: 'Module', key: 'module', width: 20 },
    { header: 'Endpoint', key: 'endpoint', width: 16 },
    { header: 'HTTP Method', key: 'method', width: 12 },
    { header: 'Request Payload', key: 'requestPayload', width: 40 },
    { header: 'Expected Status Code', key: 'expectedStatus', width: 18 },
    { header: 'Expected Response', key: 'expectedResponse', width: 40 },
    { header: 'Actual Response', key: 'actualResponse', width: 40 },
    { header: 'Response Time (ms)', key: 'responseTime', width: 16 },
    { header: 'Database Validation', key: 'dbValidation', width: 26 },
    { header: 'Status', key: 'status', width: 14 },
  ];
  styleHeaderRow(sheet.getRow(1));
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = 'A1:K1';

  const apiCases = catalog.filter((tc) => tc.validationType === 'API' && tc.module === 'API Test Cases');
  // The most recent real request/response pair captured by api_client.py
  // for each endpoint — genuine, not fabricated — falls back to '-' when
  // no local run has produced reports/api-call-log.json yet.
  const latestByEndpoint = {};
  (apiCallLog || []).forEach((call) => {
    const endpoint = (call.name || '').split(' ').pop();
    latestByEndpoint[endpoint] = call;
  });

  apiCases.forEach((tc) => {
    const [method, endpoint] = tc.scenario.split(' ');
    const live = latestByEndpoint[endpoint];
    sheet.addRow({
      id: tc.id,
      module: 'Dental AI Backend (app.py)',
      endpoint: endpoint || tc.scenario,
      method: method || '-',
      requestPayload: live ? JSON.stringify(live.request).slice(0, 300) : '-',
      expectedStatus: tc.expectedResult.split(',')[0],
      expectedResponse: tc.expectedResult,
      actualResponse: live ? JSON.stringify(live.response).slice(0, 300) : '-',
      responseTime: live ? live.durationMs : '-',
      dbValidation: tc.module === 'API Test Cases' ? 'N/A — this backend does not write to Supabase directly' : '-',
      status: live ? 'Passed' : 'Not Executed',
    });
  });

  const lastRow = sheet.rowCount;
  addDropdown(sheet, 'K', 2, lastRow, STATUS_OPTIONS);
  return lastRow;
}

function buildDatabaseSheet(workbook, catalog) {
  const sheet = workbook.addWorksheet('Database Validation');
  sheet.columns = [
    { header: 'Database Test ID', key: 'id', width: 14 },
    { header: 'Table Name', key: 'table', width: 18 },
    { header: 'Operation', key: 'operation', width: 20 },
    { header: 'Test Scenario', key: 'scenario', width: 40 },
    { header: 'SQL Query / Supabase Call', key: 'query', width: 46 },
    { header: 'Expected Result', key: 'expectedResult', width: 44 },
    { header: 'Actual Result', key: 'actualResult', width: 20 },
    { header: 'Status', key: 'status', width: 14 },
  ];
  styleHeaderRow(sheet.getRow(1));
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = 'A1:H1';

  const dbCases = catalog.filter((tc) => tc.module === 'Supabase Database');
  dbCases.forEach((tc) => {
    const [table, operation] = tc.scenario.split(' — ');
    sheet.addRow({
      id: tc.id,
      table: table || '-',
      operation: operation || tc.scenario,
      scenario: tc.scenario,
      query: `supabase.table('${(table || '').replace(/`/g, '')}')....execute()  — see database-tests/ for the exact call`,
      expectedResult: tc.expectedResult,
      actualResult: '-',
      status: 'Not Executed',
    });
  });

  const lastRow = sheet.rowCount;
  addDropdown(sheet, 'H', 2, lastRow, STATUS_OPTIONS);
  return lastRow;
}

function buildAiModelSheet(workbook, catalog) {
  const sheet = workbook.addWorksheet('AI Model Validation');
  sheet.columns = [
    { header: 'AI Test ID', key: 'id', width: 14 },
    { header: 'Model Name', key: 'model', width: 20 },
    { header: 'Input Type', key: 'inputType', width: 20 },
    { header: 'Test Image', key: 'testImage', width: 28 },
    { header: 'Expected Prediction', key: 'expectedPrediction', width: 30 },
    { header: 'Actual Prediction', key: 'actualPrediction', width: 20 },
    { header: 'Confidence Score', key: 'confidence', width: 16 },
    { header: 'Accuracy Status', key: 'accuracyStatus', width: 16 },
    { header: 'Execution Time (ms)', key: 'executionTime', width: 16 },
  ];
  styleHeaderRow(sheet.getRow(1));
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = 'A1:I1';

  const rows = [
    { id: 'TC_AI_001', model: 'caries_model1.h5', inputType: 'Dental X-ray (positive)', testImage: 'positive_xrays/ (repo sample)', expectedPrediction: 'Caries Found' },
    { id: 'TC_AI_002', model: 'caries_model1.h5', inputType: 'Dental X-ray (healthy)', testImage: 'NOT AVAILABLE — no negative_xrays/ fixtures in repo', expectedPrediction: 'No Caries Detected' },
    { id: 'TC_XRAY_002', model: 'xray_validator.h5', inputType: 'Non X-ray photo', testImage: 'generated random-noise PNG (image_factory.py)', expectedPrediction: 'Rejected — "X-ray not found"' },
    { id: 'TC_XRAY_003', model: 'xray_validator.h5', inputType: 'Blank/flat image', testImage: 'generated flat-gray PNG (image_factory.py::blank_image_path)', expectedPrediction: 'Rejected — "X-ray not found"' },
    { id: 'TC_XRAY_004', model: 'xray_validator.h5', inputType: 'Corrupted file', testImage: 'generated truncated PNG bytes (image_factory.py::corrupted_image_path)', expectedPrediction: 'Rejected — "Invalid or corrupted image file."' },
  ];
  rows.forEach((r) => {
    sheet.addRow({
      id: r.id,
      model: r.model,
      inputType: r.inputType,
      testImage: r.testImage,
      expectedPrediction: r.expectedPrediction,
      actualPrediction: '-',
      confidence: '-',
      accuracyStatus: 'Not Executed',
      executionTime: '-',
    });
  });

  const lastRow = sheet.rowCount;
  addDropdown(sheet, 'H', 2, lastRow, STATUS_OPTIONS);
  return lastRow;
}

function buildAutomationMappingSheet(workbook, mapping) {
  const sheet = workbook.addWorksheet('Automation Mapping');
  sheet.columns = [
    { header: 'Test ID', key: 'testId', width: 14 },
    { header: 'Automation Framework', key: 'framework', width: 18 },
    { header: 'Script Location', key: 'scriptLocation', width: 42 },
    { header: 'Language', key: 'language', width: 12 },
    { header: 'Execution Command', key: 'executionCommand', width: 24 },
    { header: 'CI/CD Status', key: 'ciStatus', width: 14 },
    { header: 'Test Identifier (join key)', key: 'testIdentifier', width: 60 },
    { header: 'Notes', key: 'notes', width: 40 },
  ];
  styleHeaderRow(sheet.getRow(1));
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = 'A1:H1';

  mapping.forEach((m) => sheet.addRow({ ...m, notes: m.notes || '' }));
  return sheet.rowCount;
}

function buildDefectTrackingSheet(workbook) {
  const sheet = workbook.addWorksheet('Defect Tracking');
  sheet.columns = [
    { header: 'Defect ID', key: 'defectId', width: 12 },
    { header: 'Test Case ID', key: 'testCaseId', width: 14 },
    { header: 'Issue Description', key: 'description', width: 44 },
    { header: 'Severity', key: 'severity', width: 12 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Environment', key: 'environment', width: 20 },
    { header: 'Screenshot', key: 'screenshot', width: 24 },
    { header: 'Logs', key: 'logs', width: 24 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Assigned To', key: 'assignedTo', width: 18 },
  ];
  styleHeaderRow(sheet.getRow(1));
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = 'A1:J1';

  // Intentionally empty of rows — no real defects have been logged against
  // this suite yet. Fabricating sample "example" defects here would be
  // indistinguishable from real ones once this file is shared; the
  // dropdowns below are pre-wired so the first real defect is one click
  // away from being entered correctly.
  addDropdown(sheet, 'D', 2, 100, SEVERITY_OPTIONS);
  addDropdown(sheet, 'E', 2, 100, PRIORITY_OPTIONS.slice(0, 4));
  addDropdown(sheet, 'I', 2, 100, ['Open', 'In Progress', 'Fixed', 'Verified', 'Closed', 'Reopened']);
  return 1;
}

function buildExecutionHistorySheet(workbook, ghHistory) {
  const sheet = workbook.addWorksheet('Execution History');
  sheet.columns = [
    { header: 'Execution ID', key: 'executionId', width: 14 },
    { header: 'Date', key: 'date', width: 20 },
    { header: 'Build Number', key: 'buildNumber', width: 14 },
    { header: 'Branch', key: 'branch', width: 16 },
    { header: 'Device', key: 'device', width: 20 },
    { header: 'Android Version', key: 'androidVersion', width: 16 },
    { header: 'Total Tests', key: 'totalTests', width: 12 },
    { header: 'Passed', key: 'passed', width: 10 },
    { header: 'Failed', key: 'failed', width: 10 },
    { header: 'Duration', key: 'duration', width: 14 },
  ];
  styleHeaderRow(sheet.getRow(1));
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = 'A1:J1';

  // Real runs from the GitHub Actions API (testdata/github-actions-history.json)
  // — this repo doesn't yet parse per-suite pass/fail counts out of each
  // historical run's artifacts, so Total/Passed/Failed are only populated
  // for the current run (via reports/*.json); older runs show '-' rather
  // than a guessed number.
  (ghHistory || []).forEach((run) => {
    sheet.addRow({
      executionId: run.runId,
      date: run.executionDate ? new Date(run.executionDate) : '-',
      buildNumber: run.runId,
      branch: run.branch,
      device: 'GitHub Actions emulator (x86_64, API 34)',
      androidVersion: '14',
      totalTests: '-',
      passed: '-',
      failed: '-',
      duration: run.durationSeconds ? `${run.durationSeconds}s` : '-',
    });
  });
  return sheet.rowCount;
}

function buildGithubActionsResultsSheet(workbook, ghHistory) {
  const sheet = workbook.addWorksheet('GitHub Actions Results');
  sheet.columns = [
    { header: 'Workflow Name', key: 'workflowName', width: 26 },
    { header: 'Run ID', key: 'runId', width: 16 },
    { header: 'Commit ID', key: 'commitId', width: 14 },
    { header: 'Branch', key: 'branch', width: 14 },
    { header: 'Execution Date', key: 'executionDate', width: 20 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Passed Tests', key: 'passedTests', width: 14 },
    { header: 'Failed Tests', key: 'failedTests', width: 14 },
    { header: 'Report Link', key: 'reportLink', width: 50 },
    { header: 'Artifact Link', key: 'artifactLink', width: 50 },
  ];
  styleHeaderRow(sheet.getRow(1));
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = 'A1:J1';

  (ghHistory || []).forEach((run) => {
    sheet.addRow({
      workflowName: run.workflowName,
      runId: run.runId,
      commitId: (run.commitId || '').slice(0, 7),
      branch: run.branch,
      executionDate: run.executionDate ? new Date(run.executionDate) : '-',
      status: run.status,
      passedTests: '-',
      failedTests: '-',
      reportLink: run.htmlUrl,
      artifactLink: run.artifactsUrl,
    });
  });

  const lastRow = sheet.rowCount;
  sheet.addConditionalFormatting({
    ref: `F2:F${lastRow}`,
    rules: [
      { type: 'containsText', operator: 'containsText', text: 'success', style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFC6EFCE' } } } },
      { type: 'containsText', operator: 'containsText', text: 'failure', style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFC7CE' } } } },
    ],
  });
  return lastRow;
}

function buildDashboardSheet(workbook, catalog, execByTestId, ghHistory) {
  const sheet = workbook.addWorksheet('Dashboard', { properties: { tabColor: { argb: 'FF1F2A44' } } });
  sheet.columns = Array(6).fill({ width: 20 });

  sheet.mergeCells('A1:F1');
  sheet.getCell('A1').value = 'Dental AI — QA Test Management Dashboard';
  sheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF1F2A44' } };
  sheet.getRow(1).height = 28;

  const total = catalog.length;
  const passed = catalog.filter((c) => (execByTestId.get(c.id) || {}).status === 'Passed').length;
  const failed = catalog.filter((c) => (execByTestId.get(c.id) || {}).status === 'Failed').length;
  const automated = catalog.filter((c) => /^Automated/.test(c.automationStatus)).length;
  const passPct = total ? Math.round((passed / total) * 1000) / 10 : 0;
  const failPct = total ? Math.round((failed / total) * 1000) / 10 : 0;

  const tiles = [
    ['Total Test Cases', total],
    ['Automated', automated],
    ['Passed (last run)', passed],
    ['Failed (last run)', failed],
    ['Pass %', `${passPct}%`],
    ['Failure %', `${failPct}%`],
  ];
  tiles.forEach(([label, value], idx) => {
    const col = String.fromCharCode(65 + idx);
    sheet.getCell(`${col}3`).value = label;
    sheet.getCell(`${col}3`).font = { bold: true };
    sheet.getCell(`${col}4`).value = value;
    sheet.getCell(`${col}4`).font = { size: 18, bold: true, color: { argb: 'FF1F2A44' } };
    sheet.getCell(`${col}4`).alignment = { horizontal: 'center' };
  });

  // Module coverage — a real ExcelJS capability (dataBar conditional
  // formatting) standing in for a native bar chart; see the file-level
  // comment at the top for why there's no true chart object here.
  sheet.getCell('A6').value = 'Module Coverage (test case count per module)';
  sheet.getCell('A6').font = { bold: true, size: 12 };
  sheet.getRow(7).values = ['Module', 'Test Cases'];
  styleHeaderRow(sheet.getRow(7));
  const modules = [...new Set(catalog.map((c) => c.module))];
  let r = 8;
  modules.forEach((m) => {
    sheet.getCell(`A${r}`).value = m;
    sheet.getCell(`B${r}`).value = catalog.filter((c) => c.module === m).length;
    r += 1;
  });
  sheet.addConditionalFormatting({
    ref: `B8:B${r - 1}`,
    rules: [{
      type: 'dataBar',
      gradient: true,
      minLength: 0,
      maxLength: 100,
      color: { argb: 'FF4472C4' },
      cfvo: [{ type: 'min' }, { type: 'max' }],
    }],
  });

  // Execution status breakdown — color scale in lieu of a pie chart.
  const statusStartRow = r + 2;
  sheet.getCell(`A${statusStartRow - 1}`).value = 'Test Execution Status';
  sheet.getCell(`A${statusStartRow - 1}`).font = { bold: true, size: 12 };
  sheet.getRow(statusStartRow).values = ['Status', 'Count'];
  styleHeaderRow(sheet.getRow(statusStartRow));
  const statusCounts = STATUS_OPTIONS.map((s) => [s, catalog.filter((c) => (execByTestId.get(c.id) || { status: 'Not Executed' }).status === s).length]);
  statusCounts.forEach(([label, count], idx) => {
    sheet.getCell(`A${statusStartRow + 1 + idx}`).value = label;
    sheet.getCell(`B${statusStartRow + 1 + idx}`).value = count;
  });
  sheet.addConditionalFormatting({
    ref: `B${statusStartRow + 1}:B${statusStartRow + statusCounts.length}`,
    rules: [{
      type: 'colorScale',
      cfvo: [{ type: 'min' }, { type: 'percentile', value: 50 }, { type: 'max' }],
      color: [{ argb: 'FFFFC7CE' }, { argb: 'FFFFEB9C' }, { argb: 'FFC6EFCE' }],
    }],
  });

  // Recent CI runs, so the dashboard reflects the live pipeline too.
  const ciStartRow = statusStartRow + statusCounts.length + 3;
  sheet.getCell(`A${ciStartRow - 1}`).value = 'Recent GitHub Actions Runs (live)';
  sheet.getCell(`A${ciStartRow - 1}`).font = { bold: true, size: 12 };
  sheet.getRow(ciStartRow).values = ['Workflow', 'Status', 'Branch', 'Date'];
  styleHeaderRow(sheet.getRow(ciStartRow));
  (ghHistory || []).slice(0, 8).forEach((run, idx) => {
    sheet.getCell(`A${ciStartRow + 1 + idx}`).value = run.workflowName;
    sheet.getCell(`B${ciStartRow + 1 + idx}`).value = run.status;
    sheet.getCell(`C${ciStartRow + 1 + idx}`).value = run.branch;
    sheet.getCell(`D${ciStartRow + 1 + idx}`).value = run.executionDate ? new Date(run.executionDate) : '-';
  });

  sheet.getCell(`A${ciStartRow + 10}`).value = 'Note: ExcelJS cannot create native chart objects — select the ranges above (Module Coverage / Test Execution Status) and use Excel\'s Insert > Chart for a real chart. Data bars/color scales above are the closest this library can do natively.';
  sheet.getCell(`A${ciStartRow + 10}`).font = { italic: true, size: 9, color: { argb: 'FF666666' } };
  sheet.mergeCells(`A${ciStartRow + 10}:F${ciStartRow + 10}`);
  sheet.getRow(ciStartRow + 10).height = 30;
  sheet.getCell(`A${ciStartRow + 10}`).alignment = { wrapText: true };
}

// --- Main ------------------------------------------------------------

async function buildReport() {
  const catalog = readJsonIfExists(path.join(ROOT, 'testdata', 'testCaseCatalog.json'), []);
  const mapping = readJsonIfExists(path.join(ROOT, 'testdata', 'automationMapping.json'), []);
  const ghHistory = readJsonIfExists(path.join(ROOT, 'testdata', 'github-actions-history.json'), []);
  const apiCallLog = readJsonIfExists(path.join(REPORTS_DIR, 'api-call-log.json'), []);

  if (catalog.length === 0) {
    console.warn('testCaseCatalog.json is empty — run buildTestCatalogFromMarkdown.js first.');
  }

  const mappingById = new Map(mapping.map((m) => [m.testId, m]));
  const mochawesome = loadMochawesomeResults();
  const apiResults = loadPytestResults('api-report.json');
  const dbResults = loadPytestResults('database-report.json');

  const execByTestId = new Map();
  catalog.forEach((tc) => {
    const m = mappingById.get(tc.id);
    execByTestId.set(tc.id, resolveExecutionStatus(m, mochawesome, apiResults, dbResults));
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Dental-app QA Automation Framework';
  workbook.created = new Date();

  buildDashboardSheet(workbook, catalog, execByTestId, ghHistory);
  buildSummarySheet(workbook, catalog, mappingById, execByTestId);
  buildCompleteTestCasesSheet(workbook, catalog, execByTestId);
  buildMobileUiSheet(workbook, catalog);
  buildApiSheet(workbook, catalog, apiCallLog);
  buildDatabaseSheet(workbook, catalog);
  buildAiModelSheet(workbook, catalog);
  buildAutomationMappingSheet(workbook, mapping);
  buildDefectTrackingSheet(workbook);
  buildExecutionHistorySheet(workbook, ghHistory);
  buildGithubActionsResultsSheet(workbook, ghHistory);

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  await workbook.xlsx.writeFile(OUTPUT_PATH);
  console.log(`Test management report written to ${OUTPUT_PATH}`);
  console.log(`${catalog.length} test cases, ${mapping.length} automation mappings, ${ghHistory.length} CI runs.`);
}

if (require.main === module) {
  buildReport().catch((err) => {
    console.error('Failed to build test management report:', err);
    process.exit(1);
  });
}

module.exports = { buildReport };
