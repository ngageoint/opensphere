goog.provide('os.events.SettingChangeEvent');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');



/**
 * A setting change event.
 * @param {string} type The setting that changed
 * @param {*=} opt_newVal The new value
 * @param {*=} opt_oldVal The old value
 * @param {Object=} opt_target Reference to the object that is the target of
 *     this event. It has to implement the {@code EventTarget} interface
 *     declared at {@link http://developer.mozilla.org/en/DOM/EventTarget}.
 * @extends {goog.events.Event}
 * @constructor
 */
os.events.SettingChangeEvent = function(type, opt_newVal, opt_oldVal, opt_target) {
  os.events.SettingChangeEvent.base(this, 'constructor', type, opt_target);

  /**
   * The new value
   * @type {?*}
   */
  this.newVal = opt_newVal != undefined ? opt_newVal : null;


  /**
   * The old value
   * @type {?*}
   */
  this.oldVal = opt_oldVal != undefined ? opt_oldVal : null;
};
goog.inherits(os.events.SettingChangeEvent, goog.events.Event);
