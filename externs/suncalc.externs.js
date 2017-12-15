/**
 * @fileoverview Externs for SunCalc
 * @see https://github.com/mourner/suncalc
 * @externs
 */

var SunCalc = {};

/**
 * @typedef {{
 *  nauticalDawn: Date,
 *  dawn: Date,
 *  sunrise: Date,
 *  sunriseEnd: Date,
 *  goldenHour: Date,
 *  goldenHourEnd: Date,
 *  solarNoon: Date,
 *  sunsetStart: Date,
 *  sunset: Date,
 *  dusk: Date,
 *  nauticalDusk: Date,
 *  night: Date,
 *  nadir: Date,
 *  nightEnd: Date,
 * }}
 */
SunCalc.SunTimes;


/**
 * @typedef {{
 *   altitude: number,
 *   azimuth: number
 * }}
 */
SunCalc.SunPosition;


/**
 * @typedef {{
 *   rise: Date,
 *   set: Date,
 *   alwaysUp: boolean,
 *   alwaysDown: boolean
 * }}
 */
SunCalc.MoonTimes;


/**
 * @typedef {{
 *   altitude: number,
 *   azimuth: number,
 *   distance: number,
 *   parallacticAngle: number
 * }}
 */
SunCalc.MoonPosition;


/**
 * @typedef {{
 *   fraction: number,
 *   phase: number,
 *   angle: number
 * }}
 */
SunCalc.MoonIllumination;


/**
 * @param {Date} date The date
 * @param {number} lat The latitude in degrees
 * @param {number} lon The longitude in degrees
 * @return {SunCalc.SunTimes} The times for various sun events
 */
SunCalc.getTimes = function(date, lat, lon) {};


/**
 * @param {Date} date The date and time
 * @param {number} lat The latitude in degrees
 * @param {number} lon The longitude in degrees
 * @return {SunCalc.SunPosition} The sun position
 */
SunCalc.getPosition = function(date, lat, lon) {};


/**
 * @param {Date} date The date
 * @param {number} lat The latitude in degrees
 * @param {number} lon The longitude in degrees
 * @param {boolean=} opt_inUTC
 * @return {SunCalc.MoonTimes} The times for moon rise/set
 */
SunCalc.getMoonTimes = function(date, lat, lon, opt_inUTC) {};


/**
 * @param {Date} date The date
 * @param {number} lat The latitude in degrees
 * @param {number} lon The longitude in degrees
 * @return {SunCalc.MoonPosition} The moon position
 */
SunCalc.getMoonPosition = function(date, lat, lon) {};


/**
 * @param {Date} date The date
 * @return {SunCalc.MoonIllumination} The moon illumination results
 */
SunCalc.getMoonIllumination = function(date) {};
