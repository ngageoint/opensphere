goog.module('os.bearing.BearingSettingsKeys');
goog.module.declareLegacyNamespace();


/**
 * The base key used by all bearing settings.
 * @type {string}
 */
const baseKey = 'bearing.';

/**
 * Bearing settings keys.
 * @enum {string}
 */
exports = {
  COF_URL: baseKey + 'cofUrl',
  COF_VERSION: baseKey + 'cofVersion',
  BEARING_TYPE: baseKey + 'type',
  MAGNETIC_NORTH_HELP_URL: baseKey + 'magneticNorthHelpUrl'
};
