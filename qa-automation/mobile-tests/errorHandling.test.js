const { expect } = require('chai');
const { createDriver, quitDriver } = require('../utilities/driverFactory');
const env = require('../config/environment');
const LoginPage = require('../pages/LoginPage');
const ScanPage = require('../pages/ScanPage');
const SettingsPage = require('../pages/SettingsPage');

// TC_AI_004 / TC_ERR_001: the AI backend being unreachable is the one
// "server down" scenario this suite can actually force deterministically —
// point Settings' API URL at a port nothing listens on. Supabase-unreachable
// scenarios (TC_ERR_002/003) would need blocking Supabase's specific host
// from the emulator without also blocking the app's own traffic, which
// isn't wired up yet (see README "Known gaps").
describe('Error Handling — AI backend unreachable', function () {
  this.timeout(120000);
  let driver;
  let loginPage;
  let scanPage;
  let settingsPage;

  before(async () => {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
    scanPage = new ScanPage(driver);
    settingsPage = new SettingsPage(driver);
  });

  after(async () => {
    await quitDriver();
  });

  beforeEach(async () => {
    await driver.terminateApp(env.appPackage);
    await driver.activateApp(env.appPackage);
    await loginPage.navigateFromMarketingHome();
    await loginPage.login(env.testUser.email, env.testUser.password);

    await scanPage.goToTab('settings');
    // Port 5999 is not bound by anything in this environment — the fetch
    // in predictApi.js will fail fast with a connection error.
    await settingsPage.setApiUrl('http://127.0.0.1:5999/predict');

    await scanPage.goToTab('scan');
  });

  it('does not crash and resets the scanning state when the AI backend is unreachable', async () => {
    await scanPage.openDropzone();
    const pickerThumbnail = await driver.$('android=new UiSelector().resourceIdMatches(".*:id/icon_thumbnail")');
    await pickerThumbnail.waitForDisplayed({ timeout: 15000 });
    await pickerThumbnail.click();

    await scanPage.tapAnalyse();

    // scan.js's catch block alert()s "Scan failed." and sets isScanning back
    // to false — confirm the app returns to the upload screen (dropzone
    // testID reappears) rather than hanging on the scanning/progress view.
    const backToUploadScreen = await scanPage.isDisplayed('scan-dropzone', 30000);
    expect(backToUploadScreen).to.equal(
      true,
      'expected scan.js to recover to the upload screen after a failed fetch, not hang or crash'
    );

    const resultAppeared = await scanPage.isDisplayed('scan-result-outcome', 3000);
    expect(resultAppeared).to.equal(false, 'no prediction should have been produced');
  });
});
