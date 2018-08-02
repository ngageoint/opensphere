goog.provide('os.events.ErrorEvent');
goog.require('goog.events.Event');



/**
 * Event object which contains error message
 * @constructor
 * @extends {goog.events.Event}
 * @param {?string} message
 * @param {string=} opt_type
 * @param {Object=} opt_target
 */
os.events.ErrorEvent = function(message, opt_type, opt_target) {
  os.events.ErrorEvent.base(this, 'constructor', opt_type || os.events.EventType.ERROR, opt_target);

  /**
   * @type {?string}
   * @private
   */
  this.message_ = message;
};
goog.inherits(os.events.ErrorEvent, goog.events.Event);


/**
 * @return {?string}
 */
os.events.ErrorEvent.prototype.getMessage = function() {
  return this.message_;
};
