const { remote } = require('webdriverio');
const env = require('../config/environment');
const { androidDevClientCapabilities } = require('../config/capabilities');
const { logger } = require('./logger');

let activeDriver = null;

async function createDriver() {
  logger.info('Starting Appium session', {
    host: env.appium.host,
    port: env.appium.port,
    device: env.device.name,
  });

  // No `path` set here — defaults to webdriverio's "/", which must match
  // however the Appium server is started (no --base-path flag). A mismatch
  // here (e.g. server started with --base-path /wd/hub) fails silently as
  // a connection/session-creation error with no obvious cause.
  activeDriver = await remote({
    hostname: env.appium.host,
    port: env.appium.port,
    logLevel: 'error',
    capabilities: androidDevClientCapabilities,
  });

  return activeDriver;
}

async function quitDriver() {
  if (!activeDriver) return;
  try {
    await activeDriver.deleteSession();
  } catch (err) {
    logger.error('Error tearing down Appium session', { error: err.message });
  } finally {
    activeDriver = null;
  }
}

function getDriver() {
  if (!activeDriver) {
    throw new Error('Appium driver not initialized. Call createDriver() in a before() hook first.');
  }
  return activeDriver;
}

module.exports = { createDriver, quitDriver, getDriver };
