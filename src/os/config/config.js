goog.module('os.config');

const {NAMESPACE} = goog.require('os');
const {getSettings} = goog.require('os.config.instance');


/**
 * @define {string} Namespace used by settings to indicate which application is making updates.
 * Will be assigned by each app.
 */
const appNs = goog.define('os.config.appNs', NAMESPACE);

/**
 * @define {string} Namespace for common settings - those to be rememberred across all applications
 */
const coreNs = goog.define('os.config.coreNs', 'core');

/**
 * Get the application name from settings.
 *
 * @param {string=} opt_default The default value
 * @return {(string|undefined)}
 */
const getAppName = function(opt_default) {
  return /** @type {(string|undefined)} */ (getSettings().get('about.application', opt_default));
};

/**
 * Get the application version from settings.
 *
 * @param {string=} opt_default The default value
 * @return {(string|undefined)}
 */
const getAppVersion = function(opt_default) {
  return /** @type {(string|undefined)} */ (getSettings().get('about.version', opt_default));
};

/**
 * Get the designated support contact for application issues.
 *
 * @param {string=} opt_default The default value
 * @return {(string|undefined)}
 */
const getSupportContact = function(opt_default) {
  return /** @type {(string|undefined)} */ (getSettings().get('supportContact', opt_default));
};

exports = {
  appNs,
  coreNs,
  getAppName,
  getAppVersion,
  getSupportContact
};
