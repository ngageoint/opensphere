goog.provide('os.ui.menu.MenuEvent');
goog.provide('os.ui.menu.MenuEventType');

goog.require('goog.events.Event');



/**
 * @enum {string}
 */
os.ui.menu.MenuEventType = {
  OPEN: 'menu:open'
};


/**
 * @constructor
 * @param {!(string|goog.events.EventId)} type Event type.
 * @param {T} context The menu context.
 * @param {Object=} opt_target Reference to the object that is the target of this event.
 * @extends {goog.events.Event}
 * @template T
 */
os.ui.menu.MenuEvent = function(type, context, opt_target) {
  os.ui.menu.MenuEvent.base(this, 'constructor', type, opt_target);

  /**
   * @type {T}
   * @private
   */
  this.context_ = context;
};
goog.inherits(os.ui.menu.MenuEvent, goog.events.Event);


/**
 * Gets the context associated with this event
 * @return {T} The context
 */
os.ui.menu.MenuEvent.prototype.getContext = function() {
  return this.context_;
};
