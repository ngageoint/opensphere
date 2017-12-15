goog.provide('os.ui.location');
goog.require('os.config.Settings');
goog.require('os.ui');


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.location.LOGGER_ = goog.log.getLogger('os.ui.location');


/**
 * @enum {string}
 */
os.ui.location.Format = {
  DEG: 'deg',
  DMS: 'dms',
  MGRS: 'mgrs'
};


/**
 * Display settings keys.
 * @enum {string}
 */
os.ui.location.LocationSetting = {
  POSITION: 'locationFormat',
  POSITIONOLD: 'os.map.mousePosition'
};


/**
 * Get the currently selected location format
 * @return {string}
 */
os.ui.location.getCurrentFormat = function() {
  return /** @type {string} */ (os.settings.get(
      os.ui.location.LocationSetting.POSITION, os.ui.location.Format.DEG));
};


/**
 * Helper function to format a lat lon in the current format.  Good
 * for text only fields.
 * @param {number|string} lat
 * @param {number|string} lon
 * @return {string}
 */
os.ui.location.formatAsCurrent = function(lat, lon) {
  lat = parseFloat(lat);
  lon = parseFloat(lon);

  var curFormat = os.ui.location.getCurrentFormat();

  try {
    var filter = /** @type {angular.$filter} */ (os.ui.injector.get('$filter'));
    var formatter = filter(curFormat);
    return formatter(lat, lon);
  } catch (e) {
    // make this super obvious so we catch it in dev
    // some errors come as a result of poorly formatted text, ignore those
    if (!goog.isDef(filter)) {
      goog.log.warning(os.ui.location.LOGGER_, '$filter service unavailable!');
    } else if (!goog.isDef(os.ui.injector)) {
      goog.log.warning(os.ui.location.LOGGER_, 'os.ui.injector service never defined!');
    } else {
      goog.log.warning(os.ui.location.LOGGER_, 'Unknown error trying to use formatter!');
    }
  }

  return lat + '°  ' + lon + '°';
};
