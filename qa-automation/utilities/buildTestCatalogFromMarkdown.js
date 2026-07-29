// Parses ../TEST_CASES.md's per-module tables into a single structured
// catalog (testdata/testCaseCatalog.json). TEST_CASES.md is the source of
// truth — this script exists so the Excel test-management report (Sheet 2
// onward) can never silently drift from it. Re-run this after editing
// TEST_CASES.md, before regenerating the Excel report.
const fs = require('fs');
const path = require('path');

const MD_PATH = path.resolve(__dirname, '../TEST_CASES.md');
const OUT_PATH = path.resolve(__dirname, '../testdata/testCaseCatalog.json');

function stripMarkdown(text) {
  return text
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/\\n/g, ' ')
    .trim();
}

function splitRow(line) {
  // Drop the leading/trailing pipe, split on unescaped pipes.
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map((c) => stripMarkdown(c));
}

function isSeparatorRow(line) {
  return /^\|?[\s:-]+\|[\s:|-]+$/.test(line.trim());
}

function cleanModuleName(heading) {
  // "## MODULE 3 — Patient Management" -> "Patient Management"
  return heading.replace(/^##\s*MODULE\s*\d+\s*[—-]\s*/i, '').trim();
}

function normalize(moduleName, row) {
  const get = (...keys) => {
    for (const k of keys) {
      if (row[k] !== undefined && row[k] !== '') return row[k];
    }
    return undefined;
  };

  const id = get('Test ID', 'AI Test ID', 'API Test ID', 'Database Test ID');
  if (!id || !/^TC_/.test(id)) return null; // skip Module 11's non-test-case component table, section dividers, etc.

  // Modules 12/13 use their own column schemas (Endpoint/Method/... and
  // Table/Operation/...) rather than the common Scenario/Validation shape
  // the other modules share — special-cased rather than forced through the
  // generic fallbacks, which produced misleading values (e.g. an API test's
  // "Validates" rationale text landing in the Validation *Type* column).
  if (moduleName === 'API Test Cases') {
    return {
      id,
      module: moduleName,
      scenario: `${row['Method']} ${row['Endpoint']}`.trim(),
      description: row['Validates'] || '-',
      precondition: '-',
      testData: '-',
      steps: `${row['Method']} request to ${row['Endpoint']}`,
      expectedResult: row['Expected Status'] || '-',
      validationType: 'API',
      priority: 'Not Specified',
      automationStatus: row['Automation'] || '-',
    };
  }

  if (moduleName === 'Supabase Database') {
    return {
      id,
      module: moduleName,
      scenario: `${row['Table']} — ${row['Operation']}`.trim(),
      description: row['Expected Result'] || '-',
      precondition: '-',
      testData: '-',
      steps: `${row['Operation']} on ${row['Table']}`,
      expectedResult: row['Expected Result'] || '-',
      validationType: 'Database',
      priority: 'Not Specified',
      automationStatus: row['Automation'] || '-',
    };
  }

  return {
    id,
    module: moduleName,
    scenario: get('Scenario', 'Model Name') || '',
    description: get('Scenario') || '',
    precondition: get('Preconditions / Test Data', 'Request Payload') || '-',
    testData: get('Preconditions / Test Data', 'Test Data') || '-',
    steps: get('Steps') || '-',
    expectedResult: get('Expected Result', 'Budget') || '-',
    validationType: get('Validation') || 'N/A',
    priority: get('Priority') || 'Not Specified',
    automationStatus: get('Automation') || '-',
  };
}

function parse(markdown) {
  const lines = markdown.split('\n');
  const catalog = [];
  let currentModule = null;
  let headerCols = null;
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^##\s*MODULE\s*\d+/.test(line)) {
      currentModule = cleanModuleName(line);
      inTable = false;
      headerCols = null;
      continue;
    }

    if (!currentModule) continue;

    if (line.trim().startsWith('|')) {
      if (!inTable) {
        headerCols = splitRow(line);
        inTable = true;
        continue;
      }
      if (isSeparatorRow(line)) continue;

      const cells = splitRow(line);
      const row = {};
      headerCols.forEach((col, idx) => {
        row[col] = cells[idx] !== undefined ? cells[idx] : '';
      });
      const normalized = normalize(currentModule, row);
      if (normalized) catalog.push(normalized);
    } else if (inTable && line.trim() === '') {
      inTable = false;
      headerCols = null;
    }
  }

  return catalog;
}

const markdown = fs.readFileSync(MD_PATH, 'utf8');
const catalog = parse(markdown);
fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(catalog, null, 2));
console.log(`Parsed ${catalog.length} test cases from TEST_CASES.md -> ${path.relative(process.cwd(), OUT_PATH)}`);

const moduleCounts = {};
catalog.forEach((tc) => { moduleCounts[tc.module] = (moduleCounts[tc.module] || 0) + 1; });
console.log('By module:', moduleCounts);
