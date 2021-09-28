goog.declareModuleId('os.bearing.BearingSettingsKeys');


/**
 * The base key used by all bearing settings.
 * @type {string}
 */
const baseKey = 'bearing.';

/**
 * Bearing settings keys.
 * @enum {string}
 */
const BearingSettingsKeys = {
  COF_URL: baseKey + 'cofUrl',
  COF_VERSION: baseKey + 'cofVersion',
  BEARING_TYPE: baseKey + 'type',
  MAGNETIC_NORTH_HELP_URL: baseKey + 'magneticNorthHelpUrl'
};

export default BearingSettingsKeys;
