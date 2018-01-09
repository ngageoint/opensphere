/**
 * Externs file for the Geomag library. The library takes a set of experimentally recorded magnetic field strength
 * values for the earth and uses them to calculate things about the magnetic field everywhere. We use it to calculate
 * magnetic declination, used to convert from true north bearings to magnetic north bearings.
 * @externs
 */


/**
 * Takes lat, lon, altitude, and a date and returns the magnetic field properties
 * for that time and location.
 *
 * @typedef {function(!number, !number, !number, !Date):!Object}
 */
var GeoMagFunction;

/**
 * @param {string} cof The WMM.cof file
 * @return {Object} The World Magnetic Model as an object
 */
var cof2Obj = function(cof) {};

/**
 * @param {Object} wmm The World Magnetic Model
 * @return {GeoMagFunction}
 */
var geoMagFactory = function(wmm) {};


