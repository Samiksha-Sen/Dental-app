const { expect } = require('chai');
const { createDriver, quitDriver } = require('../utilities/driverFactory');
const { get_test_supabase_client } = require('../utilities/supabaseTestHelper');
const env = require('../config/environment');
const LoginPage = require('../pages/LoginPage');
const DashboardPage = require('../pages/DashboardPage');

describe('Dashboard', function () {
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

  beforeEach(async () => {
    await driver.terminateApp(env.appPackage);
    await driver.activateApp(env.appPackage);
    await loginPage.navigateFromMarketingHome();
    await loginPage.login(env.testUser.email, env.testUser.password);
    await dashboardPage.isLoaded();
  });

  it('displays the three stat cards: Total AI Scans, Severe Caries, Patients Tracked', async () => {
    expect(await dashboardPage.isDisplayed('dashboard-stat-total-scans')).to.equal(true);
    expect(await dashboardPage.isDisplayed('dashboard-stat-severe-caries')).to.equal(true);
    expect(await dashboardPage.isDisplayed('dashboard-stat-patients-tracked')).to.equal(true);
  });

  it('navigates to the Patients detail screen when the "Patients Tracked" card is tapped', async () => {
    await dashboardPage.openPatientsTracked();
    const onDetailScreen = await driver.$('android=new UiSelector().textContains("Patients")').isDisplayed().catch(() => false);
    expect(onDetailScreen).to.equal(true, 'expected navigation to /(portal)/dashboard/patients');
  });

  it('navigates to the AI Scans detail screen when the "Total AI Scans" card is tapped', async () => {
    await dashboardPage.openTotalScans();
    const onDetailScreen = await driver.$('android=new UiSelector().textContains("Scans")').isDisplayed().catch(() => false);
    expect(onDetailScreen).to.equal(true, 'expected navigation to /(portal)/dashboard/ai-scans');
  });

  it('navigates to the Severe Caries detail screen when that card is tapped', async () => {
    await dashboardPage.openSevereCaries();
    const onDetailScreen = await driver.$('android=new UiSelector().textContains("Caries")').isDisplayed().catch(() => false);
    expect(onDetailScreen).to.equal(true, 'expected navigation to /(portal)/dashboard/severe-caries');
  });

  it('shows a Patients Tracked count matching the patients table row count', async () => {
    const supabase = get_test_supabase_client();
    const { count, error } = await supabase.from('patients').select('id', { count: 'exact', head: true });
    expect(error).to.equal(null);

    const displayedText = await dashboardPage.getPatientsTrackedCount();
    const displayedCount = parseInt(displayedText.replace(/[^0-9]/g, ''), 10);
    expect(displayedCount).to.equal(count, 'dashboard count should match Supabase patients row count');
  });
});
