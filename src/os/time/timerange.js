goog.provide('os.time.TimeRange');
goog.require('goog.date.Date');
goog.require('goog.date.DateLike');
goog.require('goog.date.UtcDateTime');
goog.require('os.registerClass');
goog.require('os.time.ITime');
goog.require('os.time.TimeInstant');



/**
 * A time range
 * @param {os.time.ITime|goog.date.DateLike|string|number=} opt_start The start time
 * @param {os.time.ITime|goog.date.DateLike|string|number=} opt_end The end time
 * @extends {os.time.TimeInstant}
 * @constructor
 */
os.time.TimeRange = function(opt_start, opt_end) {
  os.time.TimeRange.base(this, 'constructor', opt_start);

  /**
   * @type {number}
   * @private
   */
  this.end_ = 0;

  if (opt_end != undefined) {
    this.setEnd(opt_end);
  }
};
goog.inherits(os.time.TimeRange, os.time.TimeInstant);


/**
 * Class name
 * @type {string}
 * @const
 */
os.time.TimeRange.NAME = 'os.time.TimeRange';
os.registerClass(os.time.TimeRange.NAME, os.time.TimeRange);


/**
 * @inheritDoc
 */
os.time.TimeRange.prototype.getStart = function() {
  return this.start < this.end_ ? this.start : this.end_;
};


/**
 * @inheritDoc
 */
os.time.TimeRange.prototype.getEnd = function() {
  return this.end_ > this.start ? this.end_ : this.start;
};


/**
 * @inheritDoc
 */
os.time.TimeRange.prototype.setEnd = function(value) {
  this.end_ = os.time.TimeInstant.parseTime(value);
};


/**
 * @inheritDoc
 */
os.time.TimeRange.prototype.compare = function(other) {
  if (other) {
    if (!this.equals(other)) {
      if (other instanceof os.time.TimeRange) {
        if (other.getEnd() <= this.getStart()) {
          // greater if this time starts at or after the other ends
          return 1;
        } else if (other.getStart() >= this.getEnd()) {
          // less if the other time starts after this one ends
          return -1;
        } else if (other.getStart() < this.getStart()) {
          // greater if this time starts after the other starts
          return 1;
        } else if (other.getStart() > this.getStart()) {
          // less if this time starts after the other starts
          return -1;
        } else if (other.getEnd() < this.getEnd()) {
          // greater if this time ends after the other ends
          return 1;
        } else if (other.getEnd() > this.getEnd()) {
          // less if this time ends before the other ends
          return -1;
        }
      } else {
        // other is a time instant, so let it do the compare and flip the result
        return -1 * other.compare(this);
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
os.time.TimeRange.prototype.toISOString = function(opt_separator) {
  var d = new goog.date.UtcDateTime();
  var parts = [];

  parts.push(this.getStartISOString(d));
  parts.push(opt_separator || ' to ');
  parts.push(this.getEndISOString(d));

  return parts.join('');
};


/**
 * Gets an ISO-8601 representation of the start time.
 * @param {goog.date.UtcDateTime=} opt_dateTime Optional datetime parameter for obtaining the time offset.
 * @return {string} The ISO-8601 string representation
 */
os.time.TimeRange.prototype.getStartISOString = function(opt_dateTime) {
  var d = opt_dateTime || new goog.date.UtcDateTime();
  var s = this.getStart();

  if (isNaN(s) || s === os.time.TimeInstant.MIN_TIME) {
    return 'Unbounded';
  } else {
    return os.time.toOffsetString(s, d);
  }
};


/**
 * Gets an ISO-8601 representation of the end time.
 * @param {goog.date.UtcDateTime=} opt_dateTime Optional datetime parameter for obtaining the time offset.
 * @return {string} The ISO-8601 string representation
 */
os.time.TimeRange.prototype.getEndISOString = function(opt_dateTime) {
  var d = opt_dateTime || new goog.date.UtcDateTime();
  var e = this.getEnd();

  if (isNaN(e) || e === os.time.TimeInstant.MAX_TIME) {
    return 'Unbounded';
  } else {
    return os.time.toOffsetString(e, d);
  }
};
