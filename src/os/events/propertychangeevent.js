goog.declareModuleId('os.events.PropertyChangeEvent');

const GoogEvent = goog.require('goog.events.Event');
const GoogEventType = goog.require('goog.events.EventType');

/**
 * A property change event.
 */
export default class PropertyChangeEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {string=} opt_property The property that changed
   * @param {*=} opt_newVal The new value
   * @param {*=} opt_oldVal The old value
   * @param {Object=} opt_target Reference to the object that is the target of
   *     this event. It has to implement the {@code EventTarget} interface
   *     declared at {@link http://developer.mozilla.org/en/DOM/EventTarget}.
   */
  constructor(opt_property, opt_newVal, opt_oldVal, opt_target) {
    super(GoogEventType.PROPERTYCHANGE, opt_target);

    /**
     * The property
     * @type {?string}
     * @private
     */
    this.property_ = opt_property !== undefined ? opt_property : null;

    /**
     * The new value
     * @type {?*}
     * @private
     */
    this.newVal_ = opt_newVal !== undefined ? opt_newVal : null;

    /**
     * The old value
     * @type {?*}
     * @private
     */
    this.oldVal_ = opt_oldVal !== undefined ? opt_oldVal : null;
  }

  /**
   * Gets the property that changed
   *
   * @return {?string}
   */
  getProperty() {
    return this.property_;
  }

  /**
   * Gets the new value of the property
   *
   * @return {?*}
   */
  getNewValue() {
    return this.newVal_;
  }

  /**
   * Gets the old value of the property
   *
   * @return {?*}
   */
  getOldValue() {
    return this.oldVal_;
  }
}


/**
 * Override the type so these events can be used with {@link ol.events.EventTarget.prototype.dispatchEvent}.
 *
 * @type {EventTarget|OLEventTarget|undefined}
 * @suppress {duplicate}
 */
PropertyChangeEvent.prototype.target;
