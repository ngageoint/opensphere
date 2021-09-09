goog.module('os.time.TimelineControllerEvent');

const GoogEvent = goog.require('goog.events.Event');
const TimeRange = goog.require('os.time.TimeRange');


/**
 * Event for os.time.TimelineController.
 */
class TimelineControllerEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {string} type
   */
  constructor(type) {
    super(type);

    /**
     * @type {boolean}
     * @private
     */
    this.fade_ = false;

    /**
     * @type {?TimeRange}
     * @private
     */
    this.range_ = null;

    /**
     * @type {number}
     * @private
     */
    this.current_ = 0;

    /**
     * @type {number}
     * @private
     */
    this.window_ = 0;
  }

  /**
   * @param {number} current
   * @param {boolean} fade
   * @param {number} window
   */
  setData(current, fade, window) {
    this.current_ = current;
    this.fade_ = fade;
    this.window_ = window;
    this.range_ = new TimeRange(window, current);
  }

  /**
   * @return {boolean}
   */
  getFade() {
    return this.fade_;
  }

  /**
   * @return {?TimeRange}
   */
  getRange() {
    return this.range_;
  }

  /**
   * @return {number}
   */
  getCurrent() {
    return this.current_;
  }

  /**
   * @return {number}
   */
  getWindow() {
    return this.window_;
  }

  /**
   * @return {string} String representing the time range, if present.
   * @override
   */
  toString() {
    if (this.range_) {
      return this.range_.toISOString();
    }

    return super.toString();
  }
}

exports = TimelineControllerEvent;
