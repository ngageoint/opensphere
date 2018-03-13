goog.provide('os.time.TimeInstant');
goog.require('goog.date.Date');
goog.require('goog.date.DateLike');
goog.require('goog.date.UtcDateTime');
goog.require('goog.math');
goog.require('os.implements');
goog.require('os.registerClass');
goog.require('os.time.ITime');



/**
 * A time instant
 * @param {os.time.ITime|goog.date.DateLike|string|number=} opt_time A date, string, or number with the time
 * @constructor
 * @implements {os.time.ITime}
 */
os.time.TimeInstant = function(opt_time) {
  /**
   * @type {number}
   * @protected
   */
  this.start = 0;

  if (opt_time != undefined) {
    this.setStart(opt_time);
  }
};
os.implements(os.time.TimeInstant, os.time.ITime.ID);


/**
 * Class name
 * @type {string}
 * @const
 */
os.time.TimeInstant.NAME = 'os.time.TimeInstant';
os.registerClass(os.time.TimeInstant.NAME, os.time.TimeInstant);


/**
 * The minimum time (synchronized with the server team's lower 'unbounded' value)
 *
 * Fun fact: This is the original minimum date value for SQL servers and was chosen because it's the first full
 * year after Britain switched to the Gregorian calendar.
 * @const
 * @type {number}
 */
os.time.TimeInstant.MIN_TIME = moment.utc('1753-01-01T00:00:00Z').valueOf();


/**
 * The maximum time (synchronized with the server team's upper 'unbounded' value)
 * @const
 * @type {number}
 */
os.time.TimeInstant.MAX_TIME = moment.utc('9999-12-31T23:59:59Z').valueOf();


/**
 * @inheritDoc
 */
os.time.TimeInstant.prototype.getStart = function() {
  return this.start;
};


/**
 * @inheritDoc
 */
os.time.TimeInstant.prototype.setStart = function(value) {
  this.start = os.time.TimeInstant.parseTime(value);
};


/**
 * @inheritDoc
 */
os.time.TimeInstant.prototype.getEnd = function() {
  return this.start;
};


/**
 * @inheritDoc
 */
os.time.TimeInstant.prototype.setEnd = function(value) {
  this.setStart(value);
};


/**
 * @inheritDoc
 */
os.time.TimeInstant.prototype.compare = function(other) {
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
};


/**
 * @inheritDoc
 */
os.time.TimeInstant.prototype.equals = function(other) {
  return other != null && other.getStart() == this.getStart() && other.getEnd() == this.getEnd();
};


/**
 * @inheritDoc
 */
os.time.TimeInstant.prototype.intersects = function(other) {
  if (other) {
    return other.getStart() <= this.start && this.start <= other.getEnd();
  }
  return false;
};


/**
 * @inheritDoc
 */
os.time.TimeInstant.prototype.toISOString = function(opt_separator) {
  return isNaN(this.start) ? 'Unbounded' : os.time.toOffsetString(this.start);
};


/**
 * @override
 */
os.time.TimeInstant.prototype.toString = function() {
  return this.toISOString();
};


/**
 * Parses a value to time in ms UTC
 * @param {*} value The value
 * @return {number} Parsed milliseconds, or 0 if the value could not be parsed
 */
os.time.TimeInstant.parseTime = function(value) {
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
        } else if (typeof /** @type {os.time.ITime} */ (value).getStart == 'function') {
          // os.time.ITime object
          v = value.getStart();
        }
        break;
      default:
        break;
    }
  }

  // expand goog.math.clamp for efficiency
  return isNaN(v) ? 0 : Math.min(Math.max(v, os.time.TimeInstant.MIN_TIME), os.time.TimeInstant.MAX_TIME);
};
