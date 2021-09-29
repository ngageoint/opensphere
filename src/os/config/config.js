goog.declareModuleId('os.config');

import {NAMESPACE} from '../os.js';
import {getSettings} from './configinstance.js';

/**
 * @define {string} Namespace used by settings to indicate which application is making updates, assigned by
 * compile-time defines.
 */
const definedAppNs = goog.define('os.config.appNs', NAMESPACE);

/**
 * Namespace used by settings to indicate which application is making updates.
 * @type {string}
 */
export let appNs = definedAppNs;

/**
 * Set the app settings namespace.
 * @param {string} value The new value.
 */
export const setAppNs = (value) => {
  appNs = value;
};

/**
 * @define {string} Namespace for common settings used between related applications, assigned by compile-time defines.
 */
const definedCoreNs = goog.define('os.config.coreNs', 'core');

/**
 * Namespace for common settings used between related applications.
 * @type {string}
 */
export let coreNs = definedCoreNs;

/**
 * Set the namespace for common settings.
 * @param {string} value The new value.
 */
export const setCoreNs = (value) => {
  coreNs = value;
};

/**
 * Get the application name from settings.
 *
 * @param {string=} opt_default The default value
 * @return {(string|undefined)}
 */
export const getAppName = function(opt_default) {
  return /** @type {(string|undefined)} */ (getSettings().get('about.application', opt_default));
};

/**
 * Get the application version from settings.
 *
 * @param {string=} opt_default The default value
 * @return {(string|undefined)}
 */
export const getAppVersion = function(opt_default) {
  return /** @type {(string|undefined)} */ (getSettings().get('about.version', opt_default));
};

/**
 * Get the designated support contact for application issues.
 *
 * @param {string=} opt_default The default value
 * @return {(string|undefined)}
 */
export const getSupportContact = function(opt_default) {
  return /** @type {(string|undefined)} */ (getSettings().get('supportContact', opt_default));
};
