const { expect } = require('chai');
const { createDriver, quitDriver } = require('../utilities/driverFactory');
const env = require('../config/environment');
const LoginPage = require('../pages/LoginPage');
const DashboardPage = require('../pages/DashboardPage');

describe('Application Launch & Lifecycle', function () {
  this.timeout(120000);
  let driver;
  let loginPage;
  let dashboardPage;

  before(async () => {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
    dashboardPage = new DashboardPage(driver);
  });

  after(async () => {
    await quitDriver();
  });

  // TC_APP_001 + TC_PERF_001: cold launch, no crash, within a generous
  // budget (dev-client + Metro-bundled JS is slower than a production build).
  it('@smoke launches without crashing and reaches an interactive screen within budget', async () => {
    await driver.terminateApp(env.appPackage);

    const start = Date.now();
    await driver.activateApp(env.appPackage);

    const reachedMarketingOrDashboard = await Promise.race([
      loginPage.waitForTestId('marketing-launch-demo-button', { timeout: 20000 }).then(() => true).catch(() => false),
      dashboardPage.isLoaded(),
    ]);
    const elapsedMs = Date.now() - start;

    expect(reachedMarketingOrDashboard).to.equal(true, 'expected either the marketing home or the dashboard to render');
    expect(elapsedMs).to.be.below(20000, `cold start took ${elapsedMs}ms, over the 20s CI budget`);
  });

  // TC_APP_003: real background/resume (not kill+relaunch) should not lose
  // state or crash — distinct from auth.test.js's terminateApp/activateApp
  // restart check, which exercises session *persistence* rather than this.
  it('recovers state after being backgrounded and resumed', async () => {
    await driver.terminateApp(env.appPackage);
    await driver.activateApp(env.appPackage);
    await loginPage.navigateFromMarketingHome();
    await loginPage.login(env.testUser.email, env.testUser.password);
    expect(await dashboardPage.isLoaded()).to.equal(true);

    await driver.background(5); // seconds; app resumes automatically after

    expect(await dashboardPage.isLoaded()).to.equal(true, 'expected the dashboard to still be showing after resume, not a crash/reset');
  });
});
