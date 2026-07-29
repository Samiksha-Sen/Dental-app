const BasePage = require('./BasePage');

class SignupPage extends BasePage {
  async signUp({ fullName, email, password, confirmPassword }) {
    if (fullName !== undefined) await this.typeInto('signup-fullname-input', fullName);
    if (email !== undefined) await this.typeInto('signup-email-input', email);
    if (password !== undefined) await this.typeInto('signup-password-input', password);
    if (confirmPassword !== undefined) await this.typeInto('signup-confirm-password-input', confirmPassword);
    await this.tapTestId('signup-submit-button');
  }
}

module.exports = SignupPage;
