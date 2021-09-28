goog.declareModuleId('os.time.TimeRange');

import registerClass from '../registerclass.js';
import * as time from './time.js';
import TimeInstant from './timeinstant.js';

const UtcDateTime = goog.require('goog.date.UtcDateTime');

const DateLike = goog.requireType('goog.date.DateLike');
const {default: ITime} = goog.requireType('os.time.ITime');


/**
 * A time range
 */
export default class TimeRange extends TimeInstant {
  /**
   * Constructor.
   * @param {ITime|DateLike|string|number=} opt_start The start time
   * @param {os.time.ITime|DateLike|string|number=} opt_end The end time
   */
  constructor(opt_start, opt_end) {
    super(opt_start);

    /**
     * @type {number}
     * @private
     */
    this.end_ = 0;

    if (opt_end != undefined) {
      this.setEnd(opt_end);
    }
  }

  /**
   * @inheritDoc
   * @export
   */
  getStart() {
    return this.start < this.end_ ? this.start : this.end_;
  }

  /**
   * @inheritDoc
   * @export
   */
  getEnd() {
    return this.end_ > this.start ? this.end_ : this.start;
  }

  /**
   * @inheritDoc
   */
  setEnd(value) {
    this.end_ = TimeInstant.parseTime(value);
  }

  /**
   * @inheritDoc
   */
  compare(other) {
    if (other) {
      if (!this.equals(other)) {
        if (other instanceof TimeRange) {
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
  }

  /**
   * @inheritDoc
   */
  toISOString(opt_separator) {
    var d = new UtcDateTime();
    var parts = [];

    parts.push(this.getStartISOString(d));
    parts.push(opt_separator || ' to ');
    parts.push(this.getEndISOString(d));

    return parts.join('');
  }

  /**
   * Gets an ISO-8601 representation of the start time.
   *
   * @param {UtcDateTime=} opt_dateTime Optional datetime parameter for obtaining the time offset.
   * @return {string} The ISO-8601 string representation
   */
  getStartISOString(opt_dateTime) {
    var d = opt_dateTime || new UtcDateTime();
    var s = this.getStart();

    if (isNaN(s) || s === TimeInstant.MIN_TIME) {
      return 'Unbounded';
    } else {
      return time.toOffsetString(s, d);
    }
  }

  /**
   * Gets an ISO-8601 representation of the end time.
   *
   * @param {UtcDateTime=} opt_dateTime Optional datetime parameter for obtaining the time offset.
   * @return {string} The ISO-8601 string representation
   */
  getEndISOString(opt_dateTime) {
    var d = opt_dateTime || new UtcDateTime();
    var e = this.getEnd();

    if (isNaN(e) || e === TimeInstant.MAX_TIME) {
      return 'Unbounded';
    } else {
      return time.toOffsetString(e, d);
    }
  }
}


/**
 * Class name
 * @type {string}
 * @override
 */
TimeRange.NAME = 'os.time.TimeRange';
registerClass(TimeRange.NAME, TimeRange);


/**
 * @type {!TimeRange}
 */
TimeRange.UNBOUNDED = new TimeRange(-Infinity, Infinity);
