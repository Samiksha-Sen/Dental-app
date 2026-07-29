const BasePage = require('./BasePage');

class DashboardPage extends BasePage {
  async isLoaded() {
    return this.isDisplayed('dashboard-stat-patients-tracked', 20000);
  }

  async getPatientsTrackedCount() {
    const el = await this.waitForTestId('dashboard-stat-patients-tracked');
    return el.getText();
  }

  async getTotalScansCount() {
    const el = await this.waitForTestId('dashboard-stat-total-scans');
    return el.getText();
  }

  async getSevereCariesCount() {
    const el = await this.waitForTestId('dashboard-stat-severe-caries');
    return el.getText();
  }

  async openPatientsTracked() {
    await this.tapTestId('dashboard-stat-patients-tracked');
  }

  async openTotalScans() {
    await this.tapTestId('dashboard-stat-total-scans');
  }

  async openSevereCaries() {
    await this.tapTestId('dashboard-stat-severe-caries');
  }
}

module.exports = DashboardPage;
