// Mocha root hook plugin (loaded via .mocharc.json's `require`). Applies
// globally across every file in mobile-tests/ so individual specs don't
// each need to remember to wire up failure-artifact capture.
const { getDriver } = require('../utilities/driverFactory');
const { captureFailureArtifacts } = require('../utilities/screenshot');
const { logger } = require('../utilities/logger');

exports.mochaHooks = {
  async afterEach() {
    if (this.currentTest && this.currentTest.state === 'failed') {
      try {
        const driver = getDriver();
        await captureFailureArtifacts(driver, this.currentTest.fullTitle());
      } catch (err) {
        logger.error('Could not capture failure artifacts', { error: err.message });
      }
    }
  },
};
