goog.module('os.time.ITime');
goog.module.declareLegacyNamespace();

const DateLike = goog.requireType('goog.date.DateLike');
const IComparable = goog.requireType('os.IComparable');


/**
 * An interface that handles time instants, time ranges, and unbounded times.
 *
 * @extends {IComparable<ITime>}
 * @interface
 */
class ITime {
  /**
   * Gets the start date time in ms UTC
   * @return {number}
   */
  getStart() {}

  /**
   * Sets the start date time in ms UTC
   * @param {ITime|DateLike|string|number} value The start time
   */
  setStart(value) {}

  /**
   * Gets the end date time in ms UTC
   * @return {number}
   */
  getEnd() {}

  /**
   * Sets the end date time in ms UTC
   * @param {ITime|DateLike|string|number} value The end time
   */
  setEnd(value) {}

  /**
   * @param {ITime} other
   * @return {boolean}
   */
  equals(other) {}

  /**
   * Checks for intersection between this range and another
   * @param {ITime} other The other time object
   * @return {boolean} <code>true</code> if the two objects intersect, <code>false</code> otherwise
   */
  intersects(other) {}

  /**
   * Creates an ISO-8601 representation of this object
   * @param {string=} opt_separator The separator to use for time ranges
   * @return {string} The ISO-8601 string representation
   */
  toISOString(opt_separator) {}
}

/**
 * @type {string}
 */
ITime.ID = 'os.time.ITime';

exports = ITime;
