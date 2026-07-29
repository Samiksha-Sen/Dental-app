const { expect } = require('chai');
const { createDriver, quitDriver } = require('../utilities/driverFactory');
const { pressBack } = require('../utilities/gestures');
const env = require('../config/environment');
const LoginPage = require('../pages/LoginPage');
const DashboardPage = require('../pages/DashboardPage');
const PatientsPage = require('../pages/PatientsPage');

describe('Navigation', function () {
  this.timeout(120000);
  let driver;
  let loginPage;
  let dashboardPage;
  let patientsPage;

  before(async () => {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
    dashboardPage = new DashboardPage(driver);
    patientsPage = new PatientsPage(driver);
  });

  after(async () => {
    await quitDriver();
  });

  beforeEach(async () => {
    await driver.terminateApp(env.appPackage);
    await driver.activateApp(env.appPackage);
    await loginPage.navigateFromMarketingHome();
    await loginPage.login(env.testUser.email, env.testUser.password);
  });

  // TC_NAV_008. Deliberately not asserting *which* tab the hardware back
  // button lands on — that depends on React Navigation's bottom-tabs
  // `backBehavior` (unset here, so its default applies) and isn't something
  // this suite has verified independently. What matters, and what's safe to
  // assert, is that the app survives the back press and stays interactive.
  it('survives the Android hardware back button without crashing', async () => {
    await patientsPage.goToTab('patients');
    expect(await patientsPage.isDisplayed('patients-search-input')).to.equal(true);

    await pressBack(driver);

    // If the app crashed or the WebDriver session died, either of these
    // driver calls would throw — reaching the assertion is itself part of
    // the proof, on top of the explicit visibility check.
    const onDashboard = await dashboardPage.isDisplayed('dashboard-stat-patients-tracked', 5000);
    const onPatients = await patientsPage.isDisplayed('patients-search-input', 2000);
    expect(onDashboard || onPatients).to.equal(
      true,
      'expected the app to land on a known screen (dashboard or patients) after back, not crash to a blank/dead state'
    );
  });
});
