goog.module('os.events.ErrorEvent');
goog.module.declareLegacyNamespace();

const GoogEvent = goog.require('goog.events.Event');
const EventType = goog.require('os.events.EventType');


/**
 * Event object which contains error message
 */
class ErrorEvent extends GoogEvent {
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

exports = ErrorEvent;
