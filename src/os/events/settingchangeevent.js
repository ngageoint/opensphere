goog.module('os.events.SettingChangeEvent');

const GoogEvent = goog.require('goog.events.Event');


/**
 * A setting change event.
 */
class SettingChangeEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {string} type The setting that changed
   * @param {*=} opt_newVal The new value
   * @param {*=} opt_oldVal The old value
   * @param {Object=} opt_target Reference to the object that is the target of
   *     this event. It has to implement the {@code EventTarget} interface
   *     declared at {@link http://developer.mozilla.org/en/DOM/EventTarget}.
   */
  constructor(type, opt_newVal, opt_oldVal, opt_target) {
    super(type, opt_target);

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
  }
}

exports = SettingChangeEvent;
