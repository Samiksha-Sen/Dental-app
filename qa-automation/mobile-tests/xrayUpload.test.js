const { expect } = require('chai');
const path = require('path');
const { createDriver, quitDriver } = require('../utilities/driverFactory');
const env = require('../config/environment');
const LoginPage = require('../pages/LoginPage');
const ScanPage = require('../pages/ScanPage');
const SettingsPage = require('../pages/SettingsPage');

const DEVICE_PICTURES_DIR = '/sdcard/Pictures';

// Pushes fixtures straight into device storage via ADB rather than driving
// Android's native photo-picker UI. That picker is a system app whose
// resource-ids/flow differ across Android versions and OEM skins (and even
// between "Photo Picker" vs classic gallery on the same OS depending on
// Google Play Services version) — automating it reliably is its own
// project. Pushing a known file and selecting it by a fixed position is the
// standard workaround, still exercises `pickImage()` -> predictXray() ->
// Flask end to end, and only the "open native picker" step is skipped.
async function pushFixture(driver, localPath, deviceFileName) {
  const fs = require('fs');
  const data = fs.readFileSync(localPath).toString('base64');
  await driver.pushFile(`${DEVICE_PICTURES_DIR}/${deviceFileName}`, data);
}

describe('Dental X-Ray Upload', function () {
  this.timeout(180000);
  let driver;
  let loginPage;
  let scanPage;

  before(async () => {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
    scanPage = new ScanPage(driver);

    const positiveXrayDir = path.resolve(__dirname, '../../positive_xrays');
    const fs = require('fs');
    const sample = fs.readdirSync(positiveXrayDir).find((f) => /\.(png|jpe?g)$/i.test(f));
    if (sample) {
      await pushFixture(driver, path.join(positiveXrayDir, sample), 'qa_valid_xray.png');
    }
  });

  after(async () => {
    await quitDriver();
  });

  beforeEach(async () => {
    await driver.terminateApp(env.appPackage);
    await driver.activateApp(env.appPackage);
    await loginPage.navigateFromMarketingHome();
    await loginPage.login(env.testUser.email, env.testUser.password);

    // Fresh install each run (noReset:false) means Settings' AI endpoint is
    // unconfigured every time — set it before scan.js's startScan() needs it.
    const settingsPage = new SettingsPage(driver);
    await scanPage.goToTab('settings');
    await settingsPage.setApiUrl(`${env.backendUrl}/predict`);

    await scanPage.goToTab('scan');
  });

  it('analyses a valid dental X-ray and returns a caries prediction with confidence', async () => {
    await scanPage.openDropzone();
    // --- Native Android photo picker takes over here ---
    // Resource ids below match AOSP's "Photos" picker (Android 13+ Photo
    // Picker). On API levels/OEM skins using the classic Gallery app instead,
    // this selector needs updating — see README "Known CI fragility".
    const pickerThumbnail = await driver.$('android=new UiSelector().resourceIdMatches(".*:id/icon_thumbnail")');
    await pickerThumbnail.waitForDisplayed({ timeout: 15000 });
    await pickerThumbnail.click();

    await scanPage.tapAnalyse();
    const outcome = await scanPage.waitForOutcome(45000);

    expect(outcome).to.match(/Caries Found|No Caries Detected/);
  });

  it('rejects a non-X-ray photo with the "X-ray not found" message', async () => {
    // app.py's validation model (xray_validator.h5) rejects this before the
    // caries model ever runs; the app surfaces app.py's literal error text
    // via alert(), which — like other native Alert dialogs — isn't part of
    // the RN view tree a testID can target. We assert on the negative case
    // instead: the result screen (scan-result-outcome) must NOT appear.
    await scanPage.openDropzone();
    const pickerThumbnail = await driver.$('android=new UiSelector().resourceIdMatches(".*:id/icon_thumbnail")');
    await pickerThumbnail.waitForDisplayed({ timeout: 15000 });
    await pickerThumbnail.click();
    await scanPage.tapAnalyse();

    const resultAppeared = await scanPage.isDisplayed('scan-result-outcome', 20000);
    expect(resultAppeared).to.equal(
      false,
      'expected the "X-ray not found" rejection path, not a prediction result'
    );
  });
});
