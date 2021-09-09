goog.module('os.time.UnboundedRange');

const TimeInstant = goog.require('os.time.TimeInstant');


/**
 * A time range for all time
 */
class UnboundedRange extends TimeInstant {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * Always returns the minimum time
   *
   * @return {number} the minimum time
   * @override
   */
  getStart() {
    return TimeInstant.MIN_TIME;
  }

  /**
   * Always returns the maximum time
   *
   * @return {number} the maximum time
   * @override
   */
  getEnd() {
    return TimeInstant.MAX_TIME;
  }
}

exports = UnboundedRange;
