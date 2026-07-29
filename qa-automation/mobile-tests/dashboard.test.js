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

  it('@smoke displays the three stat cards: Total AI Scans, Severe Caries, Patients Tracked', async () => {
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

  it('shows a Total AI Scans count matching this user\'s scans row count', async () => {
    // useScanHistory.js calls getScansByUser(user.id), which filters
    // scans by user_id — so the dashboard number is scoped to the logged
    // -in test account, not every row in the table. Look the test user's
    // id up the same way the app does (via Supabase Auth), not a raw
    // table-wide count, or this would over-count against a shared project.
    const supabase = get_test_supabase_client();
    const { data: usersPage, error: userErr } = await supabase.auth.admin.listUsers();
    expect(userErr).to.equal(null);
    const testUser = usersPage.users.find((u) => u.email === env.testUser.email);
    expect(testUser, `expected an auth user for ${env.testUser.email}`).to.not.equal(undefined);

    const { count, error } = await supabase
      .from('scans')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', testUser.id);
    expect(error).to.equal(null);

    const displayedText = await dashboardPage.getTotalScansCount();
    const displayedCount = parseInt(displayedText.replace(/[^0-9]/g, ''), 10);
    expect(displayedCount).to.equal(count, "dashboard count should match this user's scans row count");
  });
});
