const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');

const screenshotsDir = path.resolve(__dirname, '../screenshots');
const failuresDir = path.resolve(__dirname, '../reports/failures');

function safeName(name) {
  return name.replace(/[^a-z0-9-_]/gi, '_');
}

async function capture(driver, name) {
  const fileName = `${safeName(name)}_${Date.now()}.png`;
  const filePath = path.join(screenshotsDir, fileName);
  await driver.saveScreenshot(filePath);
  logger.info(`Screenshot captured: ${fileName}`);
  return filePath;
}

// Called from Mocha's afterEach when a test fails. Captures screenshot +
// current screen/activity so a human doesn't have to re-run the suite to
// find out what the device was showing at the moment of failure.
async function captureFailureArtifacts(driver, testTitle) {
  const base = safeName(testTitle);
  const artifacts = { testTitle, timestamp: new Date().toISOString() };

  try {
    const screenshotPath = path.join(failuresDir, `${base}_${Date.now()}.png`);
    await driver.saveScreenshot(screenshotPath);
    artifacts.screenshot = screenshotPath;
  } catch (err) {
    artifacts.screenshotError = err.message;
  }

  try {
    artifacts.currentActivity = await driver.getCurrentActivity();
  } catch (err) {
    artifacts.currentActivity = `unavailable: ${err.message}`;
  }

  try {
    artifacts.pageSource = (await driver.getPageSource()).slice(0, 5000);
  } catch (err) {
    artifacts.pageSource = `unavailable: ${err.message}`;
  }

  try {
    const logs = await driver.getLogs('logcat');
    artifacts.deviceLogTail = logs.slice(-50).map((l) => l.message);
  } catch (err) {
    artifacts.deviceLogTail = `unavailable: ${err.message}`;
  }

  fs.writeFileSync(
    path.join(failuresDir, `${base}_${Date.now()}.json`),
    JSON.stringify(artifacts, null, 2)
  );
  logger.error(`Failure artifacts captured for "${testTitle}"`, { screenshot: artifacts.screenshot });

  return artifacts;
}

module.exports = { capture, captureFailureArtifacts };
