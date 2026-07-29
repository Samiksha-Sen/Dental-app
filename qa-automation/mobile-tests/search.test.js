const { expect } = require('chai');
const { createDriver, quitDriver } = require('../utilities/driverFactory');
const env = require('../config/environment');
const LoginPage = require('../pages/LoginPage');
const PatientsPage = require('../pages/PatientsPage');

const runSuffix = Date.now().toString().slice(-6);
const searchTarget = { name: `Search QA ${runSuffix}`, phone: `97${runSuffix}11`.slice(0, 10).padEnd(10, '2'), age: '41' };

describe('Patient Search', function () {
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

  it('finds an existing patient by full name', async () => {
    await patientsPage.createPatient(searchTarget);
    await patientsPage.search(searchTarget.name);
    const found = await driver.$(`//*[contains(@text,"${searchTarget.name}")]`).isDisplayed().catch(() => false);
    expect(found).to.equal(true);
  });

  it('finds an existing patient by a partial name match', async () => {
    await patientsPage.createPatient(searchTarget);
    const partial = searchTarget.name.split(' ')[0]; // "Search"
    await patientsPage.search(partial);
    const found = await driver.$(`//*[contains(@text,"${searchTarget.name}")]`).isDisplayed().catch(() => false);
    expect(found).to.equal(true, `expected partial match "${partial}" to surface "${searchTarget.name}"`);
  });

  it('returns no results for a name that does not exist', async () => {
    await patientsPage.search('Zzzznonexistentpatientxyz');
    const anyCardVisible = await driver.$('~patients-search-input').isDisplayed(); // search bar itself always renders
    expect(anyCardVisible).to.equal(true);
    const bogusMatch = await driver.$('//*[contains(@text,"Zzzznonexistentpatientxyz")]').isDisplayed().catch(() => false);
    expect(bogusMatch).to.equal(false, 'search input text itself should not be mistaken for a result card');
  });
});
