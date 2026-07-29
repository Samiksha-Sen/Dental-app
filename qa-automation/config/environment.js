require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

function required(name, fallback) {
  const v = process.env[name] ?? fallback;
  if (v === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

module.exports = {
  expoUrl: process.env.EXPO_URL || 'http://localhost:8081',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
  apkPath: process.env.APK_PATH || './build/dental-ai-dev-client.apk',
  appPackage: process.env.APP_PACKAGE || 'com.samiksha08.app',
  appActivity: process.env.APP_ACTIVITY || '.MainActivity',

  appium: {
    host: process.env.APPIUM_HOST || '127.0.0.1',
    port: Number(process.env.APPIUM_PORT || 4723),
  },

  device: {
    name: process.env.DEVICE_NAME || 'emulator-5554',
    platformVersion: process.env.PLATFORM_VERSION || '14',
    automationName: process.env.AUTOMATION_NAME || 'UiAutomator2',
  },

  testUser: {
    email: process.env.TEST_USER_EMAIL,
    password: process.env.TEST_USER_PASSWORD,
    invalidPassword: process.env.TEST_USER_INVALID_PASSWORD || 'wrong-password',
  },

  reportEnvLabel: process.env.REPORT_ENV_LABEL || 'local',

  required,
};
