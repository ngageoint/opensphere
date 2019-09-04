goog.provide('os.events.PayloadEvent');

goog.require('goog.events.Event');



/**
 * An event carrying an arbitrary data payload.
 *
 * @param {string} type The event type.
 * @param {T=} opt_payload The payload.
 * @extends {goog.events.Event}
 * @constructor
 * @template T
 */
os.events.PayloadEvent = function(type, opt_payload) {
  os.events.PayloadEvent.base(this, 'constructor', type);

  /**
   * The property
   * @type {?T}
   * @private
   */
  this.payload_ = opt_payload;
};
goog.inherits(os.events.PayloadEvent, goog.events.Event);


/**
 * Override the type so these events can be used with {@link ol.events.EventTarget.prototype.dispatchEvent}.
 *
 * @type {EventTarget|ol.events.EventTarget|undefined}
 * @suppress {duplicate}
 */
os.events.PayloadEvent.prototype.target;


/**
 * Gets the payload.
 *
 * @return {?T}
 */
os.events.PayloadEvent.prototype.getPayload = function() {
  return this.payload_;
};


/**
 * Sets the payload.
 *
 * @param {T} value The payload to set.
 */
os.events.PayloadEvent.prototype.setPayload = function(value) {
  this.payload_ = value;
};
