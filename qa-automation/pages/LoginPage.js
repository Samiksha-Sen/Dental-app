const BasePage = require('./BasePage');

class LoginPage extends BasePage {
  // App boots on the marketing landing page when there's no session
  // (see dental_rn_app/app/index.js); the login screen isn't the initial
  // route, so every test starting from a clean app install needs this hop.
  async navigateFromMarketingHome() {
    await this.tapTestId('marketing-launch-demo-button');
    await this.waitForTestId('login-submit-button');
  }

  async login(email, password) {
    if (email !== undefined) await this.typeInto('login-email-input', email);
    if (password !== undefined) await this.typeInto('login-password-input', password);
    await this.tapTestId('login-submit-button');
  }

  async isLoaded() {
    return this.isDisplayed('login-submit-button');
  }
}

module.exports = LoginPage;
