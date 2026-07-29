const env = require('./environment');

// Targets a compiled expo-dev-client / EAS development build APK, not the
// published Expo Go app. Expo Go's own launcher UI (QR/URL entry screen) is
// not ours to control and isn't designed for automation — a real APK gives
// Appium a normal Android app with a stable package/activity to launch.
// See qa-automation/README.md ("Why not Expo Go") for the full rationale.
const androidDevClientCapabilities = {
  platformName: 'Android',
  'appium:automationName': env.device.automationName,
  'appium:deviceName': env.device.name,
  'appium:platformVersion': env.device.platformVersion,
  'appium:app': env.apkPath,
  'appium:appPackage': env.appPackage,
  'appium:appActivity': env.appActivity,
  'appium:autoGrantPermissions': true,
  'appium:newCommandTimeout': 240,
  'appium:noReset': false,
};

module.exports = { androidDevClientCapabilities };
