goog.declareModuleId('os.events.PayloadEvent');

const GoogEvent = goog.require('goog.events.Event');

/**
 * An event carrying an arbitrary data payload.
 *
 * @template T
 */
export default class PayloadEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {string} type The event type.
   * @param {T=} opt_payload The payload.
   */
  constructor(type, opt_payload) {
    super(type);

    /**
     * The property
     * @type {?T}
     * @private
     */
    this.payload_ = opt_payload;
  }

  /**
   * Gets the payload.
   *
   * @return {?T}
   */
  getPayload() {
    return this.payload_;
  }

  /**
   * Sets the payload.
   *
   * @param {T} value The payload to set.
   */
  setPayload(value) {
    this.payload_ = value;
  }
}


/**
 * Override the type so these events can be used with {@link ol.events.EventTarget.prototype.dispatchEvent}.
 *
 * @type {EventTarget|OLEventTarget|undefined}
 * @suppress {duplicate}
 */
PayloadEvent.prototype.target;
