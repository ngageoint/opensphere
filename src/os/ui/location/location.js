goog.module('os.ui.location');

goog.require('os.ui.location.ddmFilter');
goog.require('os.ui.location.degFilter');
goog.require('os.ui.location.dmsFilter');
goog.require('os.ui.location.mgrsFilter');

const log = goog.require('goog.log');
const Settings = goog.require('os.config.Settings');
const ui = goog.require('os.ui');
const Format = goog.require('os.ui.location.Format');

const Logger = goog.requireType('goog.log.Logger');


/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.location');

/**
 * Display settings keys.
 * @enum {string}
 */
const LocationSetting = {
  POSITION: 'locationFormat',
  POSITIONOLD: 'os.map.mousePosition'
};

/**
 * Get the currently selected location format
 *
 * @return {string}
 */
const getCurrentFormat = function() {
  return /** @type {string} */ (Settings.getInstance().get(LocationSetting.POSITION, Format.DEG));
};

/**
 * Helper function to format a lat lon in the current format.  Good
 * for text only fields.
 *
 * @param {number|string} lat
 * @param {number|string} lon
 * @return {string}
 */
const formatAsCurrent = function(lat, lon) {
  lat = parseFloat(lat);
  lon = parseFloat(lon);

  var curFormat = getCurrentFormat();

  try {
    var filter = /** @type {angular.$filter} */ (ui.injector.get('$filter'));
    var formatter = filter(curFormat);
    return formatter(lat, lon);
  } catch (e) {
    // make this super obvious so we catch it in dev
    // some errors come as a result of poorly formatted text, ignore those
    if (filter === undefined) {
      log.warning(logger, '$filter service unavailable!');
    } else if (ui.injector === undefined) {
      log.warning(logger, 'os.ui.injector service never defined!');
    } else {
      log.warning(logger, 'Unknown error trying to use formatter!');
    }
  }

  return lat + '°  ' + lon + '°';
};

exports = {
  LocationSetting,
  getCurrentFormat,
  formatAsCurrent
};
