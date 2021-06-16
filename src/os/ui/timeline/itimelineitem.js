goog.module('os.ui.timeline.ITimelineItem');
goog.module.declareLegacyNamespace();

const IDisposable = goog.requireType('goog.disposable.IDisposable');
const Listenable = goog.requireType('goog.events.Listenable');


/**
 * @interface
 * @extends {Listenable}
 * @extends {IDisposable}
 */
class ITimelineItem {
  /**
   * @return {string}
   */
  getId() {}

  /**
   * @param {string} id The ID
   */
  setId(id) {}

  /**
   * @return {boolean}
   */
  isInteractive() {}

  /**
   * @param {boolean} value
   */
  setInteractive(value) {}

  /**
   * @return {?d3.Scale}
   */
  getXScale() {}

  /**
   * @param {?d3.Scale} scale
   */
  setXScale(scale) {}

  /**
   * @return {Array<os.ui.action.Action>}
   */
  getActions() {}

  /**
   * @param {Array<os.ui.action.Action>} actions
   */
  setActions(actions) {}

  /**
   * @param {?function(number):number} snapFunc The rounding function
   */
  setSnap(snapFunc) {}

  /**
   * Gets the time extent of the item
   * @return {Array<number>}
   */
  getExtent() {}

  /**
   * Gets the average time for this item
   * @return {number}
   */
  getAvg() {}

  /**
   * Initialize the SVG for the item
   * @param {d3.Selection} container
   * @param {number} height
   */
  initSVG(container, height) {}

  /**
   * Renders the item
   * @param {number=} opt_height
   */
  render(opt_height) {}
}

exports = ITimelineItem;
