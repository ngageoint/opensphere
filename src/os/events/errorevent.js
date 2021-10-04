goog.declareModuleId('os.events.ErrorEvent');

import EventType from './eventtype.js';

const GoogEvent = goog.require('goog.events.Event');


/**
 * Event object which contains error message
 */
export default class ErrorEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {?string} message
   * @param {string=} opt_type
   * @param {Object=} opt_target
   */
  constructor(message, opt_type, opt_target) {
    super(opt_type || EventType.ERROR, opt_target);

    /**
     * @type {?string}
     * @private
     */
    this.message_ = message;
  }

  /**
   * @return {?string}
   */
  getMessage() {
    return this.message_;
  }
}
