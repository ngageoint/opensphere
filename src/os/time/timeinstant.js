goog.module('os.time.TimeInstant');
goog.module.declareLegacyNamespace();

const osImplements = goog.require('os.implements');
const registerClass = goog.require('os.registerClass');
const ITime = goog.require('os.time.ITime');

const DateLike = goog.requireType('goog.date.DateLike');


/**
 * A time instant
 *
 * @implements {ITime}
 */
class TimeInstant {
  /**
   * Constructor.
   * @param {ITime|DateLike|string|number=} opt_time A date, string, or number with the time
   */
  constructor(opt_time) {
    /**
     * @type {number}
     * @protected
     */
    this.start = 0;

    if (opt_time != undefined) {
      this.setStart(opt_time);
    }
  }

  /**
   * @inheritDoc
   * @export
   */
  getStart() {
    return this.start;
  }

  /**
   * @inheritDoc
   */
  setStart(value) {
    this.start = TimeInstant.parseTime(value);
  }

  /**
   * @inheritDoc
   * @export
   */
  getEnd() {
    return this.start;
  }

  /**
   * @inheritDoc
   */
  setEnd(value) {
    this.setStart(value);
  }

  /**
   * @inheritDoc
   */
  compare(other) {
    if (other) {
      if (!this.equals(other)) {
        if (this.start < other.getStart()) {
          // less if this time starts before the other
          return -1;
        } else if (this.start >= other.getEnd()) {
          // greater if this time starts at or after the end of other
          return 1;
          // intersection
        } else if (this.start == other.getStart()) {
          // same start time
          return 0;
        } else {
          // this starts after the other
          return 1;
        }
      }

      // times are equal
      return 0;
    }

    // other is null/undefined
    return 1;
  }

  /**
   * @inheritDoc
   */
  equals(other) {
    return other != null && other.getStart() == this.getStart() && other.getEnd() == this.getEnd();
  }

  /**
   * @inheritDoc
   */
  intersects(other) {
    if (other) {
      return other.getStart() <= this.start && this.start <= other.getEnd();
    }
    return false;
  }

  /**
   * @inheritDoc
   */
  toISOString(opt_separator) {
    return isNaN(this.start) ? 'Unbounded' : os.time.toOffsetString(this.start);
  }

  /**
   * @override
   */
  toString() {
    return this.toISOString();
  }

  /**
   * Parses a value to time in ms UTC
   *
   * @param {*} value The value
   * @return {number} Parsed milliseconds, or 0 if the value could not be parsed
   */
  static parseTime(value) {
    var v = 0;

    if (value != null) {
      switch (typeof value) {
        case 'number':
          v = value;
          break;
        case 'string':
          // assume ISO strings for now
          // TODO: support non-ISO string input
          v = new Date(value).getTime();
          break;
        case 'object':
          if (typeof /** @type {Date} */ (value).getFullYear == 'function') {
            // Date object
            v = value.getTime();
          } else if (typeof /** @type {ITime} */ (value).getStart == 'function') {
            // ITime object
            v = value.getStart();
          }
          break;
        default:
          break;
      }
    }

    // expand goog.math.clamp for efficiency
    return isNaN(v) ? 0 : Math.min(Math.max(v, TimeInstant.MIN_TIME), TimeInstant.MAX_TIME);
  }
}
osImplements(TimeInstant, ITime.ID);


/**
 * Class name
 * @type {string}
 */
TimeInstant.NAME = 'os.time.TimeInstant';
registerClass(TimeInstant.NAME, TimeInstant);


/**
 * The minimum time (synchronized with the server team's lower 'unbounded' value)
 *
 * Fun fact: This is the original minimum date value for SQL servers and was chosen because it's the first full
 * year after Britain switched to the Gregorian calendar.
 * @const
 * @type {number}
 */
TimeInstant.MIN_TIME = moment.utc('1753-01-01T00:00:00Z').valueOf();


/**
 * The maximum time (synchronized with the server team's upper 'unbounded' value)
 * @const
 * @type {number}
 */
TimeInstant.MAX_TIME = moment.utc('9999-12-31T23:59:59Z').valueOf();


exports = TimeInstant;
