goog.declareModuleId('os.ui.timeline.DragPanEvent');

const GoogEvent = goog.require('goog.events.Event');


/**
 */
export default class DragPanEvent extends GoogEvent {
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
