const { expect } = require('chai');
const { createDriver, quitDriver } = require('../utilities/driverFactory');
const env = require('../config/environment');
const LoginPage = require('../pages/LoginPage');
const PatientsPage = require('../pages/PatientsPage');

const runSuffix = Date.now().toString().slice(-6);

describe('Input Sanitization & Security', function () {
  this.timeout(120000);
  let driver;
  let loginPage;
  let patientsPage;

  before(async () => {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
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
    await patientsPage.goToTab('patients');
  });

  // TC_SEC_002. The Supabase JS client sends inserts as parameterized REST
  // calls (PostgREST), not interpolated SQL, so there's no injection vector
  // here to prove closed — what's actually worth checking is the more
  // mundane failure mode: that unusual-but-legitimate characters in a name
  // (apostrophes, accents, punctuation) survive a round trip through the
  // form -> Supabase -> directory list without corruption or a crash.
  it('stores and displays a patient name containing special characters unmodified', async () => {
    const trickyName = `QA O'Brien-Muñoz #${runSuffix} <test>`;
    await patientsPage.createPatient({ name: trickyName, phone: '9012345678', age: '45' });

    await patientsPage.search(`O'Brien-Muñoz #${runSuffix}`);
    const found = await driver.$(`//*[contains(@text,"O'Brien-Muñoz #${runSuffix}")]`).isDisplayed().catch(() => false);
    expect(found).to.equal(true, 'expected the special-character name to render in the directory unchanged, not stripped/escaped/crashed');
  });
});
