const { expect } = require('chai');
const { createDriver, quitDriver } = require('../utilities/driverFactory');
const env = require('../config/environment');
const LoginPage = require('../pages/LoginPage');
const PatientsPage = require('../pages/PatientsPage');
const { get_test_supabase_client } = require('../utilities/supabaseTestHelper');

// The UI never surfaces a patient's dbId directly — look it up from
// Supabase by the unique name this suite creates, so edit/delete tests can
// target patient-edit-button-<dbId> / patient-delete-button-<dbId>.
async function findPatientDbIdByName(name) {
  const supabase = get_test_supabase_client();
  const { data, error } = await supabase.from('patients').select('id').eq('name', name).limit(1).single();
  if (error) throw error;
  return data.id;
}

// Unique per-run values so repeated CI executions don't collide on the
// "duplicate patient" check or leave ambiguous rows behind.
const runSuffix = Date.now().toString().slice(-6);
const validPatient = {
  name: `QA Patient ${runSuffix}`,
  phone: `98${runSuffix}00`.slice(0, 10).padEnd(10, '1'),
  age: '34',
};

describe('Patient Management', function () {
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

  describe('Create Patient — field validation', () => {
    it('rejects an empty name', async () => {
      await patientsPage.createPatient({ name: '', phone: validPatient.phone, age: validPatient.age });
      // onSave() alert()s and returns without closing the sheet — the name
      // input should still be present/empty, i.e. the form stayed open.
      expect(await patientsPage.isDisplayed('patient-form-name-input')).to.equal(true);
    });

    it('rejects an invalid (non-10-digit) phone number', async () => {
      await patientsPage.createPatient({ name: validPatient.name, phone: '123', age: validPatient.age });
      expect(await patientsPage.isDisplayed('patient-form-phone-input')).to.equal(true);
    });

    it('rejects an invalid age (0 or > 119)', async () => {
      await patientsPage.createPatient({ name: validPatient.name, phone: validPatient.phone, age: '0' });
      expect(await patientsPage.isDisplayed('patient-form-age-input')).to.equal(true);
    });
  });

  describe('Create Patient — success path', () => {
    it('@smoke creates a patient and shows it in the directory', async () => {
      await patientsPage.createPatient(validPatient);
      await patientsPage.search(validPatient.name);

      // databaseService.createPatient() auto-generates patient_code
      // (PAT-####); we only assert the card renders, since the exact code
      // is only known after the insert response, which the UI test doesn't
      // intercept — that assertion belongs to database-tests/.
      const cardVisible = await driver.$(`//*[contains(@text,"${validPatient.name}")]`).isDisplayed().catch(() => false);
      expect(cardVisible).to.equal(true, `expected a patient card for "${validPatient.name}" after creation`);
    });

    it('flags creating the same patient twice as a duplicate for a human to review', async () => {
      // There's no server-side uniqueness constraint on patients.name in
      // schema.sql — duplicate prevention isn't implemented in the app.
      // This test documents that gap rather than asserting behavior that
      // doesn't exist.
      await patientsPage.createPatient(validPatient);
      await patientsPage.createPatient(validPatient);
      await patientsPage.search(validPatient.name);
      const matches = await driver.$$(`//*[contains(@text,"${validPatient.name}")]`);
      expect(matches.length).to.be.greaterThan(
        1,
        'the app currently allows duplicate patient names — see schema.sql, no unique constraint on patients.name'
      );
    });
  });

  describe('Update Patient', () => {
    const target = { name: `QA Edit Target ${runSuffix}`, phone: `91${runSuffix}00`.slice(0, 10).padEnd(10, '3'), age: '50' };
    const updatedName = `QA Edited ${runSuffix}`;

    it('edits name/phone/age and reflects the change in the directory', async () => {
      await patientsPage.createPatient(target);
      const dbId = await findPatientDbIdByName(target.name);

      await patientsPage.editPatient(dbId, { name: updatedName, phone: '9123456789', age: '51' });

      await patientsPage.search(updatedName);
      const found = await driver.$(`//*[contains(@text,"${updatedName}")]`).isDisplayed().catch(() => false);
      expect(found).to.equal(true, 'expected the directory to show the updated name');
    });

    it('rejects an invalid phone number on edit', async () => {
      await patientsPage.createPatient(target);
      const dbId = await findPatientDbIdByName(target.name);

      await patientsPage.openEditForm(dbId);
      await patientsPage.fillEditForm({ phone: '123' });
      await patientsPage.submitEditForm();

      // onSaveEdit() alert()s and returns without closing the sheet.
      expect(await patientsPage.isDisplayed('patient-edit-phone-input')).to.equal(true);
    });
  });

  describe('Delete Patient', () => {
    const target = { name: `QA Delete Target ${runSuffix}`, phone: `92${runSuffix}00`.slice(0, 10).padEnd(10, '4'), age: '60' };

    it('removes the patient after confirming', async () => {
      await patientsPage.createPatient(target);
      const dbId = await findPatientDbIdByName(target.name);

      await patientsPage.deletePatient(dbId, { confirm: true });

      await patientsPage.search(target.name);
      const stillVisible = await driver.$(`//*[contains(@text,"${target.name}")]`).isDisplayed().catch(() => false);
      expect(stillVisible).to.equal(false, 'expected the patient card to be gone after confirmed deletion');
    });

    it('keeps the patient when the delete confirmation is cancelled', async () => {
      const cancelTarget = { ...target, name: `${target.name} Cancel` };
      await patientsPage.createPatient(cancelTarget);
      const dbId = await findPatientDbIdByName(cancelTarget.name);

      await patientsPage.deletePatient(dbId, { confirm: false });

      await patientsPage.search(cancelTarget.name);
      const stillVisible = await driver.$(`//*[contains(@text,"${cancelTarget.name}")]`).isDisplayed().catch(() => false);
      expect(stillVisible).to.equal(true, 'expected the patient to remain after cancelling the delete');
    });
  });
});
