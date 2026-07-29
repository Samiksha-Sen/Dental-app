const BasePage = require('./BasePage');

class PatientsPage extends BasePage {
  async search(query) {
    await this.typeInto('patients-search-input', query);
  }

  async openAddPatientForm() {
    await this.tapTestId('patients-add-new-button');
  }

  async fillNewPatientForm({ name, phone, age }) {
    if (name !== undefined) await this.typeInto('patient-form-name-input', name);
    if (phone !== undefined) await this.typeInto('patient-form-phone-input', phone);
    if (age !== undefined) await this.typeInto('patient-form-age-input', age);
  }

  async submitNewPatientForm() {
    await this.tapTestId('patient-form-save-button');
  }

  async createPatient({ name, phone, age }) {
    await this.openAddPatientForm();
    await this.fillNewPatientForm({ name, phone, age });
    await this.submitNewPatientForm();
  }

  async isPatientCardVisible(dbId) {
    return this.isDisplayed(`patient-card-${dbId}`);
  }
}

module.exports = PatientsPage;
