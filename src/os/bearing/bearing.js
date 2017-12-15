goog.provide('os.bearing');
goog.require('os.config.Settings');
goog.require('os.geo');
goog.require('os.net.Request');


/**
 * Enumeration of available bearing types.
 * @enum {string}
 */
os.bearing.BearingType = {
  TRUE_NORTH: 'trueNorth',
  MAGNETIC: 'magnetic'
};


/**
 * The base key used by all display settings.
 * @type {string}
 * @const
 */
os.bearing.BASE_KEY = 'bearing.';


/**
 * Display settings keys.
 * @enum {string}
 */
os.bearing.BearingSettingsKeys = {
  COF_URL: os.bearing.BASE_KEY + 'cofUrl',
  COF_VERSION: os.bearing.BASE_KEY + 'cofVersion',
  BEARING_TYPE: os.bearing.BASE_KEY + 'type',
  MAGNETIC_NORTH_HELP_URL: os.bearing.BASE_KEY + 'magneticNorthHelpUrl'
};


/**
 * The geomagnetic model of the earth. Used to calculate useful geomagnetic stuff.
 * @type {Geomag}
 */
os.bearing.Geomag = null;


/**
 * Loads the geomagnetic model.
 */
os.bearing.loadGeomag = function() {
  if (!os.bearing.Geomag) {
    var url = os.ROOT + os.settings.get(os.bearing.BearingSettingsKeys.COF_URL);
    var request = new os.net.Request();
    request.setUri(url);
    request.listenOnce(goog.net.EventType.SUCCESS, os.bearing.onGeomag);
    request.listenOnce(goog.net.EventType.ERROR, os.bearing.onGeomag);
    request.load();
  }
};


/**
 * Handles geomagnetic model load.
 * @param {goog.events.Event} event
 */
os.bearing.onGeomag = function(event) {
  if (event.type === goog.net.EventType.SUCCESS) {
    var response = /** @type {os.net.Request} */ (event.target).getResponse();
    var geomag = new Geomag(/** @type {string} */ (response));
    os.bearing.Geomag = geomag;
  }

  goog.dispose(event.target);
};


/**
 * Gets the bearing between two points. Based on the current application setting, it will be the true north or magnetic
 * north version.
 * @param {ol.Coordinate} coord1 The starting coordinate
 * @param {ol.Coordinate} coord2 The ending coordinate
 * @param {os.interpolate.Method=} opt_method The method to use. Defaults to the user setting for interpolation method.
 * @param {Date=} opt_date Optional date, only useful for magnetic bearing calculation
 * @return {number}
 */
os.bearing.getBearing = function(coord1, coord2, opt_method, opt_date) {
  opt_method = opt_method || os.interpolate.Method.GEODESIC;

  var bearing = opt_method === os.interpolate.Method.GEODESIC ? osasm.geodesicInverse(coord1, coord2).initialBearing :
      osasm.rhumbInverse(coord1, coord2).bearing;
  return os.bearing.modifyBearing(bearing, coord1, opt_date);
};


/**
 * Modifies a bearing by converting it to magnetic north (if applicable) and normalizing it.
 * @param {number} bearing The bearing to format
 * @param {ol.Coordinate} coord The coordinate at which the bearing is being calculated
 * @param {Date=} opt_date Optional date, only useful for magnetic bearing calculation
 * @return {number} The formatted bearing
 */
os.bearing.modifyBearing = function(bearing, coord, opt_date) {
  var bearingType = os.settings.get(os.bearing.BearingSettingsKeys.BEARING_TYPE, os.bearing.BearingType.TRUE_NORTH);
  if (bearingType == os.bearing.BearingType.MAGNETIC && os.bearing.Geomag) {
    // calculate the magnetic declination value and subtract it from the true north bearing
    var geomag = os.bearing.Geomag.calc(coord[1], coord[0], undefined, opt_date);
    bearing = bearing - geomag['dec'];
  }

  return bearing < 0 ? 360 + bearing : bearing;
};


/**
 * Gets a formatted bearing between two points. This appends a T (true) or M (magnetic) and the degree symbol.
 * @param {number} bearing The bearing to format
 * @param {number=} opt_precision The precision to round to, defaults to 5
 * @return {string} String formatted version of the bearing.
 */
os.bearing.getFormattedBearing = function(bearing, opt_precision) {
  opt_precision = goog.isDef(opt_precision) ? opt_precision : 5;
  var bearingType = os.settings.get(os.bearing.BearingSettingsKeys.BEARING_TYPE, os.bearing.BearingType.TRUE_NORTH);
  var typeString = bearingType == os.bearing.BearingType.TRUE_NORTH ? 'T' : 'M';
  return os.math.toFixed(bearing, opt_precision) + '° ' + typeString;
};
