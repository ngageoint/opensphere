goog.declareModuleId('os.ui.menu.MenuEvent');

const GoogEvent = goog.require('goog.events.Event');

const GoogEventId = goog.requireType('goog.events.EventId');


/**
 * @template T
 */
export default class MenuEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {!(string|GoogEventId)} type Event type.
   * @param {T} context The menu context.
   * @param {Object=} opt_target Reference to the object that is the target of this event.
   */
  constructor(type, context, opt_target) {
    super(type, opt_target);

    /**
     * @type {T}
     * @private
     */
    this.context_ = context;
  }

  /**
   * Gets the context associated with this event
   *
   * @return {T} The context
   */
  getContext() {
    return this.context_;
  }
}
