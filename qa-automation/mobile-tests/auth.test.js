const { expect } = require('chai');
const { createDriver, quitDriver } = require('../utilities/driverFactory');
const { logger } = require('../utilities/logger');
const env = require('../config/environment');
const LoginPage = require('../pages/LoginPage');
const SettingsPage = require('../pages/SettingsPage');
const DashboardPage = require('../pages/DashboardPage');

describe('Authentication', function () {
  this.timeout(120000);
  let driver;
  let loginPage;
  let dashboardPage;

  before(async () => {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
    dashboardPage = new DashboardPage(driver);
  });

  after(async () => {
    await quitDriver();
  });

  beforeEach(async () => {
    await driver.terminateApp(env.appPackage);
    await driver.activateApp(env.appPackage);
    await loginPage.navigateFromMarketingHome();
  });

  describe('Login screen validation', () => {
    it('rejects an empty email', async () => {
      await loginPage.login('', env.testUser.password);
      expect(await loginPage.isLoaded()).to.equal(true, 'should remain on the login screen');
    });

    it('rejects an empty password', async () => {
      await loginPage.login(env.testUser.email, '');
      expect(await loginPage.isLoaded()).to.equal(true, 'should remain on the login screen');
    });

    it('rejects an invalid email format', async () => {
      await loginPage.login('not-an-email', env.testUser.password);
      expect(await loginPage.isLoaded()).to.equal(true, 'should remain on the login screen');
    });

    it('rejects wrong credentials with a Supabase auth error', async () => {
      await loginPage.login(env.testUser.email, env.testUser.invalidPassword);
      // supabase.auth.signInWithPassword() rejects and the screen's alert()
      // surfaces "Authentication error: Invalid email or password." — we
      // assert on staying put rather than the native alert text, since
      // Alert dialogs aren't part of the RN view hierarchy testID covers.
      expect(await loginPage.isLoaded()).to.equal(true, 'should remain on the login screen after a rejected login');
    });

    it('logs in with valid credentials and reaches the dashboard', async () => {
      logger.info('Attempting login with configured TEST_USER_EMAIL');
      await loginPage.login(env.testUser.email, env.testUser.password);
      const reachedDashboard = await dashboardPage.isLoaded();
      expect(reachedDashboard).to.equal(true, 'expected navigation to /(portal)/dashboard after a valid login');
    });
  });

  describe('Session persistence', () => {
    it('keeps the user logged in after an app restart', async () => {
      await loginPage.login(env.testUser.email, env.testUser.password);
      expect(await dashboardPage.isLoaded()).to.equal(true);

      await driver.terminateApp(env.appPackage);
      await driver.activateApp(env.appPackage);

      // authService.getSession() restores the persisted Supabase session on
      // boot (see useAuth.js), so app/index.js should redirect straight to
      // the dashboard without hitting the login screen again.
      expect(await dashboardPage.isLoaded()).to.equal(
        true,
        'expected the restored Supabase session to skip the login screen'
      );
    });

    // Forcing a real JWT expiry needs control over the Supabase project's
    // token TTL or direct manipulation of the stored session, neither of
    // which is reachable from UI automation. Covering this meaningfully
    // belongs in a unit/integration test around authService.js's
    // handleAuthError() (see the "JWT expired" branch), not here.
    it.skip('handles an expired session token by redirecting to login (needs a token-injection harness, not UI automation)');
  });

  describe('Logout', () => {
    it('returns to the login screen and clears the session', async () => {
      await loginPage.login(env.testUser.email, env.testUser.password);
      expect(await dashboardPage.isLoaded()).to.equal(true);

      const settingsPage = new SettingsPage(driver);
      await settingsPage.goToTab('settings');
      await settingsPage.logout();

      const backAtLogin = await loginPage.isDisplayed('login-submit-button', 15000);
      expect(backAtLogin).to.equal(true, 'expected redirect to login after sign-out');
    });
  });
});
