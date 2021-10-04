goog.declareModuleId('os.bearing');

import Settings from '../config/settings.js';
import * as interpolate from '../interpolate.js';
import InterpolateMethod from '../interpolatemethod.js';
import * as osMath from '../math/math.js';
import Request from '../net/request.js';
import {ROOT} from '../os.js';
import BearingSettingsKeys from './bearingsettingskeys.js';
import BearingType from './bearingtype.js';

const dispose = goog.require('goog.dispose');
const NetEventType = goog.require('goog.net.EventType');


/**
 * A function that takes a lat, lon, altitude, and date and returns magnetic
 * field details for that date and time (such as declination).
 * @type {?GeoMagFunction}
 */
let geoMagFn = null;

/**
 * If the geomag library has loaded.
 * @return {boolean}
 */
export const isGeomagLoaded = () => !!geoMagFn;

/**
 * Loads the geomagnetic model.
 */
export const loadGeomag = function() {
  if (!geoMagFn) {
    var url = ROOT + Settings.getInstance().get(BearingSettingsKeys.COF_URL);
    var request = new Request(url);
    request.listenOnce(NetEventType.SUCCESS, onGeomag);
    request.listenOnce(NetEventType.ERROR, onGeomag);
    request.load();
  }
};

/**
 * Handles geomagnetic model load.
 *
 * @param {NetEventType} event
 */
export const onGeomag = function(event) {
  if (event.type === NetEventType.SUCCESS) {
    var response = /** @type {Request} */ (event.target).getResponse();
    var wmm = cof2Obj(/** @type {string} */ (response));
    geoMagFn = geoMagFactory(wmm);
  }

  dispose(event.target);
};

/**
 * Creates a geomagnetic data object for a coordinate in lon/lat and a date.
 * @param {!ol.Coordinate} coord The coordinate in lon/lat.
 * @param {!Date} date The date
 * @return {!Object} The magnetic model details for the given time and location
 */
export const geomag = function(coord, date) {
  if (geoMagFn && coord) {
    // convert altitude from meters to feet
    return geoMagFn(coord[1], coord[0], (coord[2] || 0) * 3.28084, date);
  }

  return {};
};

/**
 * Gets the bearing between two points. Based on the current application setting, it will be the true north or magnetic
 * north version.
 *
 * @param {!ol.Coordinate} coord1 The starting coordinate
 * @param {!ol.Coordinate} coord2 The ending coordinate
 * @param {!Date} date The date, only useful for magnetic bearing calculation
 * @param {!InterpolateMethod=} opt_method The method to use. Defaults to the user setting for interpolation method.
 * @return {number}
 */
export const getBearing = function(coord1, coord2, date, opt_method) {
  opt_method = opt_method || interpolate.getMethod();

  var bearing = opt_method === InterpolateMethod.GEODESIC ? osasm.geodesicInverse(coord1, coord2).initialBearing :
    osasm.rhumbInverse(coord1, coord2).bearing;
  return modifyBearing(bearing, coord1, date);
};

/**
 * Modifies a bearing by converting it to magnetic north (if applicable) and normalizing it.
 *
 * @param {!number} bearing The bearing to format
 * @param {!ol.Coordinate} coord The coordinate at which the bearing is being calculated
 * @param {!Date} date Optional date, only useful for magnetic bearing calculation
 * @param {string=} opt_bearingType Optional bearing type override.
 * @return {number} The normalized bearing
 */
export const modifyBearing = function(bearing, coord, date, opt_bearingType) {
  var bearingType = opt_bearingType ||
      Settings.getInstance().get(BearingSettingsKeys.BEARING_TYPE, BearingType.TRUE_NORTH);
  if (coord && bearingType == BearingType.MAGNETIC && geoMagFn) {
    var geomagResult = geomag(coord, date);
    bearing = bearing - geomagResult['dec'];
  }

  return bearing < 0 ? 360 + bearing : bearing;
};

/**
 * Gets a formatted bearing between two points. This appends a T (true) or M (magnetic) and the degree symbol.
 *
 * @param {!number} bearing The bearing to format
 * @param {number=} opt_precision The precision to round to, defaults to 5
 * @param {string=} opt_bearingType Optional bearing type override.
 * @return {string} String formatted version of the bearing.
 */
export const getFormattedBearing = function(bearing, opt_precision, opt_bearingType) {
  opt_precision = opt_precision !== undefined ? opt_precision : 5;
  var bearingType = opt_bearingType ||
      Settings.getInstance().get(BearingSettingsKeys.BEARING_TYPE, BearingType.TRUE_NORTH);
  var typeString = bearingType == BearingType.TRUE_NORTH ? 'T' : 'M';
  return osMath.toFixed(bearing, opt_precision) + '° ' + typeString;
};
