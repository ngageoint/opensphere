goog.provide('os.time.ITime');
goog.require('goog.date.DateLike');
goog.require('os.IComparable');



/**
 * An interface that handles time instants, time ranges, and unbounded times.
 * @extends {os.IComparable<os.time.ITime>}
 * @interface
 */
os.time.ITime = function() {};


/**
 * @type {string}
 */
os.time.ITime.ID = 'os.time.ITime';


/**
 * Gets the start date time in ms UTC
 * @return {number}
 */
os.time.ITime.prototype.getStart;


/**
 * Sets the start date time in ms UTC
 * @param {os.time.ITime|goog.date.DateLike|string|number} value The start time
 */
os.time.ITime.prototype.setStart;


/**
 * Gets the end date time in ms UTC
 * @return {number}
 */
os.time.ITime.prototype.getEnd;


/**
 * Sets the end date time in ms UTC
 * @param {os.time.ITime|goog.date.DateLike|string|number} value The end time
 */
os.time.ITime.prototype.setEnd;


/**
 * @param {os.time.ITime} other
 * @return {boolean}
 */
os.time.ITime.prototype.equals;


/**
 * Checks for intersection between this range and another
 * @param {os.time.ITime} other The other time object
 * @return {boolean} <code>true</code> if the two objects intersect, <code>false</code> otherwise
 */
os.time.ITime.prototype.intersects;


/**
 * Creates an ISO-8601 representation of this object
 * @param {string=} opt_separator The separator to use for time ranges
 * @return {string} The ISO-8601 string representation
 */
os.time.ITime.prototype.toISOString;
