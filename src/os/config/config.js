goog.provide('os.config');
goog.provide('os.config.ConfigType');
goog.provide('os.config.EventType');
goog.require('os.defines');


/**
 * @define {string} Namespace used by settings to indicate which application is making updates.
 * Will be assigned by each app.
 */
goog.define('os.config.appNs', os.NAMESPACE);


/**
 * @define {string} Namespace for common settings - those to be rememberred across all applications
 */
goog.define('os.config.coreNs', 'core');


/**
 * Event types for settings
 * @enum {string}
 */
os.config.EventType = {
  INITIALIZED: 'initialized',
  LOADED: 'loaded',
  WILL_CLEAR: 'willClear',
  WILL_SAVE: 'willSave',
  CLEARED: 'cleared',
  SAVED: 'saved',
  UPDATED: 'updated'
};


/**
 * Configuration types for settings
 * @enum {string}
 */
os.config.ConfigType = {
  CONFIG: 'admin',
  PREFERENCE: 'user',
  OVERRIDES: 'overrides'
};


/**
 * Get the application name from settings.
 * @param {string=} opt_default The default value
 * @return {(string|undefined)}
 */
os.config.getAppName = function(opt_default) {
  return /** @type {(string|undefined)} */ (os.settings.get('about.application',
      opt_default));
};


/**
 * Get the application version from settings.
 * @param {string=} opt_default The default value
 * @return {(string|undefined)}
 */
os.config.getAppVersion = function(opt_default) {
  return /** @type {(string|undefined)} */ (os.settings.get('about.version',
      opt_default));
};


/**
 * Get the designated support contact for application issues.
 * @param {string=} opt_default The default value
 * @return {(string|undefined)}
 */
os.config.getSupportContact = function(opt_default) {
  return /** @type {(string|undefined)} */ (os.settings.get('supportContact',
      opt_default));
};
