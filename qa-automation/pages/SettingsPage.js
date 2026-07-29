const BasePage = require('./BasePage');

class SettingsPage extends BasePage {
  // Native builds ship with no default AI API endpoint (see useSettings.js
  // getDefaultApiUrl()) — every fresh install needs this set once before
  // scan.js's startScan() has anything to call. Persists to AsyncStorage
  // via setApiUrl()'s onChangeText, no separate save button needed.
  async setApiUrl(url) {
    await this.typeInto('settings-api-url-input', url);
    await this.driver.hideKeyboard().catch(() => {});
  }

  async logout() {
    await this.tapTestId('settings-logout-button');
    await this.tapTestId('confirm-modal-confirm-button');
  }
}

module.exports = SettingsPage;
