goog.module('os.ui.timeline.DragPanEvent');
goog.module.declareLegacyNamespace();

const GoogEvent = goog.require('goog.events.Event');

/**
 */
class DragPanEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {string} type
   * @param {boolean} left Whether the drag/pan is to the left or right
   */
  constructor(type, left) {
    super(type);

    /**
     * @type {boolean}
     */
    this.left = left;
  }
}

exports = DragPanEvent;
