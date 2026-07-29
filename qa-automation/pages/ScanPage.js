const BasePage = require('./BasePage');

class ScanPage extends BasePage {
  async openDropzone() {
    await this.tapTestId('scan-dropzone');
  }

  async tapAnalyse() {
    await this.tapTestId('scan-analyse-button');
  }

  async waitForOutcome(timeout = 30000) {
    const el = await this.waitForTestId('scan-result-outcome', { timeout });
    return el.getText();
  }
}

module.exports = ScanPage;
