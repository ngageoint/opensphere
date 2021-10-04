goog.declareModuleId('os.time.UnboundedRange');

import TimeInstant from './timeinstant.js';


/**
 * A time range for all time
 */
export default class UnboundedRange extends TimeInstant {
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
