goog.provide('os.ui.action.ActionEvent');

goog.require('goog.events.Event');



/**
 * Adds an optional "context" object for action events
 * @constructor
 * @param {!(string|goog.events.EventId)} type Event type.
 * @param {*=} opt_context Optional context
 * @param {Object=} opt_target Reference to the object that is the target of this event.
 * @extends {goog.events.Event}
 * @deprecated Please use {@link os.ui.menu.Menu} and {@link os.ui.menu.MenuItem} instead
 */
os.ui.action.ActionEvent = function(type, opt_context, opt_target) {
  os.ui.action.ActionEvent.base(this, 'constructor', type, opt_target);

  /**
   * @type {?*}
   * @private
   */
  this.context_ = opt_context;
};
goog.inherits(os.ui.action.ActionEvent, goog.events.Event);


/**
 * Gets the context associated with this event
 * @return {?*} The context
 */
os.ui.action.ActionEvent.prototype.getContext = function() {
  return this.context_;
};
