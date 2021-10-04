goog.declareModuleId('os.ui.action.ActionEvent');

const GoogEvent = goog.require('goog.events.Event');
const GoogEventId = goog.requireType('goog.events.EventId');


/**
 * Adds an optional "context" object for action events
 *
 * @deprecated Please use {@link os.ui.menu.Menu} and {@link os.ui.menu.MenuItem} instead
 */
export default class ActionEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {!(string|GoogEventId)} type Event type.
   * @param {*=} opt_context Optional context
   * @param {Object=} opt_target Reference to the object that is the target of this event.
   */
  constructor(type, opt_context, opt_target) {
    super(type, opt_target);

    /**
     * @type {?*}
     * @private
     */
    this.context_ = opt_context;
  }

  /**
   * Gets the context associated with this event
   *
   * @return {?*} The context
   */
  getContext() {
    return this.context_;
  }
}
