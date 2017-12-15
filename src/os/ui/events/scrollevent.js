goog.provide('os.ui.events.ScrollEvent');
goog.require('goog.events.Event');



/**
 * Event that carries a selector to tell a section to scroll.
 * @param {string} selector The selector to scroll to
 * @param {string=} opt_focus Optional element to focus
 * @extends {goog.events.Event}
 * @constructor
 */
os.ui.events.ScrollEvent = function(selector, opt_focus) {
  os.ui.events.ScrollEvent.base(this, 'constructor', 'scrollto');

  /**
   * @type {string}
   * @private
   */
  this.selector_ = selector;

  /**
   * @type {string|undefined}
   * @private
   */
  this.focus_ = opt_focus;
};
goog.inherits(os.ui.events.ScrollEvent, goog.events.Event);


/**
 * @return {string}
 */
os.ui.events.ScrollEvent.prototype.getSelector = function() {
  return this.selector_;
};


/**
 * @return {string|undefined}
 */
os.ui.events.ScrollEvent.prototype.getFocus = function() {
  return this.focus_;
};
