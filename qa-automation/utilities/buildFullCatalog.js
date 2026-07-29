// Builds the final testdata/testCaseCatalog.json: the 117 curated cases
// parsed from TEST_CASES.md (buildTestCatalogFromMarkdown.js) plus the 4
// combinatorial expansions (Selenium/Appium/Vulnerability/LoadTest — see
// testdata/expansions/). Run this instead of buildTestCatalogFromMarkdown.js
// directly when you want the full workbook; the markdown-only build still
// works standalone for reviewing just the curated document's cases.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const { buildSeleniumExpansion } = require('../testdata/expansions/seleniumExpansion');
const { buildAppiumExpansion } = require('../testdata/expansions/appiumExpansion');
const { buildVulnerabilityExpansion } = require('../testdata/expansions/vulnerabilityExpansion');
const { buildLoadTestExpansion } = require('../testdata/expansions/loadTestExpansion');

const OUT_PATH = path.resolve(__dirname, '../testdata/testCaseCatalog.json');

// Regenerate the curated core catalog fresh from TEST_CASES.md first.
execSync('node ' + path.join(__dirname, 'buildTestCatalogFromMarkdown.js'), { stdio: 'inherit' });
const core = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8')).map((tc) => ({
  ...tc,
  // The core catalog's own modules (Application Launch, Patient
  // Management, API Test Cases, etc.) mostly correspond to Appium/PyTest
  // work — tag them so the "4 test types" grouping in the Excel report
  // includes this real, already-existing coverage instead of only the
  // newly generated expansion rows.
  category: tc.validationType.includes('Security') ? 'Vulnerability'
    : tc.validationType === 'Performance' ? 'LoadTest'
    : tc.validationType.includes('UI') ? 'Appium'
    : tc.validationType === 'API' ? 'API'
    : tc.validationType === 'Database' ? 'Database'
    : tc.validationType === 'AI' ? 'AI'
    : 'Core',
}));

const selenium = buildSeleniumExpansion();
const appium = buildAppiumExpansion();
const vulnerability = buildVulnerabilityExpansion();
const loadTest = buildLoadTestExpansion();

const full = [...core, ...selenium, ...appium, ...vulnerability, ...loadTest];

fs.writeFileSync(OUT_PATH, JSON.stringify(full, null, 2));

console.log(`\nFull catalog: ${full.length} total test cases`);
const byCategory = {};
full.forEach((tc) => { byCategory[tc.category] = (byCategory[tc.category] || 0) + 1; });
console.log('By category (the "4 test types" plus the rest of the core catalog):');
Object.entries(byCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => console.log(`  ${cat}: ${count}`));

const automatedCount = full.filter((tc) => /^Automated/.test(tc.automationStatus)).length;
console.log(`\n${automatedCount} of ${full.length} are genuinely Automated today; the rest are Automatable/Manual/N/A with exact specifications — see each row's automationStatus.`);
