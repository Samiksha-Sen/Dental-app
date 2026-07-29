// Base Page Object. Locates elements by accessibility id (`~testID`), the
// cross-platform Appium convention that React Native's `testID` prop maps
// to (content-desc on Android, accessibility identifier on iOS) — see the
// testID props added to FloatingInput/GradientButton/etc. in dental_rn_app.
class BasePage {
  constructor(driver) {
    this.driver = driver;
  }

  byTestId(testId) {
    return this.driver.$(`~${testId}`);
  }

  async waitForTestId(testId, { timeout = 15000, reverse = false } = {}) {
    const el = this.byTestId(testId);
    await el.waitForDisplayed({ timeout, reverse });
    return el;
  }

  async typeInto(testId, text) {
    const el = await this.waitForTestId(testId);
    await el.clearValue();
    await el.setValue(text);
    return el;
  }

  async tapTestId(testId) {
    const el = await this.waitForTestId(testId);
    await el.click();
    return el;
  }

  async isDisplayed(testId, timeout = 5000) {
    try {
      const el = this.byTestId(testId);
      return await el.waitForDisplayed({ timeout }).then(() => true);
    } catch (err) {
      return false;
    }
  }

  async getText(testId) {
    const el = await this.waitForTestId(testId);
    return el.getText();
  }

  // Bottom tab bar buttons: dashboard | scan | appointments | patients | settings
  // (tabBarTestID set per-screen in dental_rn_app/app/(portal)/_layout.js).
  async goToTab(tabName) {
    await this.tapTestId(`tab-${tabName}`);
  }
}

module.exports = BasePage;
