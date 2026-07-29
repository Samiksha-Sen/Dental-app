// Scope note (see qa-automation/README.md "Known gaps"): useAppointments.js
// is explicitly local/dummy data — "There is no `appointments` table in
// Supabase yet" (its own top-of-file comment). So this suite only covers
// what the module actually does (client-side state), and every test that
// the original spec asked for around persistence ("Supabase record") is
// marked pending with a reason rather than faked against a table that
// doesn't exist.
const { expect } = require('chai');
const { createDriver, quitDriver } = require('../utilities/driverFactory');
const env = require('../config/environment');
const LoginPage = require('../pages/LoginPage');

describe('Appointments (UI-only — no backend persistence yet)', function () {
  this.timeout(120000);
  let driver;
  let loginPage;

  before(async () => {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
  });

  after(async () => {
    await quitDriver();
  });

  beforeEach(async () => {
    await driver.terminateApp(env.appPackage);
    await driver.activateApp(env.appPackage);
    await loginPage.navigateFromMarketingHome();
    await loginPage.login(env.testUser.email, env.testUser.password);
    await loginPage.goToTab('appointments');
  });

  it('renders the Appointments tab without crashing', async () => {
    const tabLoaded = await driver.$('~tab-appointments').isDisplayed();
    expect(tabLoaded).to.equal(true);
  });

  it.skip('creating an appointment persists a Supabase record (no `appointments` table exists yet — see useAppointments.js)');
  it.skip('empty required fields are rejected (needs create-appointment testIDs added once the form is backed by real data)');
  it.skip('past-date selection is rejected (same as above)');
});
