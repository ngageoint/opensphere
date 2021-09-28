goog.declareModuleId('os.ui.location');

import './ddmfilter.js';
import './degfilter.js';
import './dmsfilter.js';
import './mgrsfilter.js';
import Settings from '../../config/settings.js';
import * as ui from '../ui.js';
import Format from './locationformat.js';

const log = goog.require('goog.log');

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
export const LocationSetting = {
  POSITION: 'locationFormat',
  POSITIONOLD: 'os.map.mousePosition'
};

/**
 * Get the currently selected location format
 *
 * @return {string}
 */
export const getCurrentFormat = function() {
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
export const formatAsCurrent = function(lat, lon) {
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
