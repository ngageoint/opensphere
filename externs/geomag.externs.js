/**
 * Externs file for the Geomag library. The library takes a set of experimentally recorded magnetic field strength
 * values for the earth and uses them to calculate things about the magnetic field everywhere. We use it to calculate
 * magnetic declination, used to convert from true north bearings to magnetic north bearings.
 * @externs
 */



/**
 * @param {string} model
 * @constructor
 */
var Geomag = function(model) {};


/**
 * Calculates the geomagnetic information for a given place and time on earth.
 * @param {number} lat
 * @param {number} lon
 * @param {number=} opt_alt
 * @param {Date=} opt_date
 * @return {Object}
 */
Geomag.prototype.calc = function(lat, lon, opt_alt, opt_date) {};
