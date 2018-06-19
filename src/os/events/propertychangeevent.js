goog.provide('os.events.PropertyChangeEvent');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');



/**
 * A property change event.
 * @param {string=} opt_property The property that changed
 * @param {*=} opt_newVal The new value
 * @param {*=} opt_oldVal The old value
 * @param {Object=} opt_target Reference to the object that is the target of
 *     this event. It has to implement the {@code EventTarget} interface
 *     declared at {@link http://developer.mozilla.org/en/DOM/EventTarget}.
 * @extends {goog.events.Event}
 * @constructor
 */
os.events.PropertyChangeEvent = function(opt_property, opt_newVal, opt_oldVal, opt_target) {
  os.events.PropertyChangeEvent.base(this, 'constructor', goog.events.EventType.PROPERTYCHANGE, opt_target);

  /**
   * The property
   * @type {?string}
   * @private
   */
  this.property_ = goog.isDef(opt_property) ? opt_property : null;

  /**
   * The new value
   * @type {?*}
   * @private
   */
  this.newVal_ = goog.isDef(opt_newVal) ? opt_newVal : null;

  /**
   * The old value
   * @type {?*}
   * @private
   */
  this.oldVal_ = goog.isDef(opt_oldVal) ? opt_oldVal : null;
};
goog.inherits(os.events.PropertyChangeEvent, goog.events.Event);


/**
 * Override the type so these events can be used with {@link ol.events.EventTarget.prototype.dispatchEvent}.
 *
 * @type {EventTarget|ol.events.EventTarget|undefined}
 * @suppress {duplicate}
 */
os.events.PropertyChangeEvent.prototype.target;


/**
 * Gets the property that changed
 * @return {?string}
 */
os.events.PropertyChangeEvent.prototype.getProperty = function() {
  return this.property_;
};


/**
 * Gets the new value of the property
 * @return {?*}
 */
os.events.PropertyChangeEvent.prototype.getNewValue = function() {
  return this.newVal_;
};


/**
 * Gets the old value of the property
 * @return {?*}
 */
os.events.PropertyChangeEvent.prototype.getOldValue = function() {
  return this.oldVal_;
};
