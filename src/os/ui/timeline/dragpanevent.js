goog.provide('os.ui.timeline.DragPanEvent');
goog.provide('os.ui.timeline.DragPanEventType');

goog.require('goog.events.Event');


/**
 * @enum {string}
 */
os.ui.timeline.DragPanEventType = {
  START: 'dragpanstart',
  STOP: 'dragpanstop'
};



/**
 * @param {string} type
 * @param {boolean} left Whether the drag/pan is to the left or right
 * @extends {goog.events.Event}
 * @constructor
 */
os.ui.timeline.DragPanEvent = function(type, left) {
  os.ui.timeline.DragPanEvent.base(this, 'constructor', type);

  /**
   * @type {boolean}
   */
  this.left = left;
};
goog.inherits(os.ui.timeline.DragPanEvent, goog.events.Event);
