goog.module('os.ui.timeline.ITimelineItem');
goog.module.declareLegacyNamespace();

const IDisposable = goog.requireType('goog.disposable.IDisposable');
const Listenable = goog.requireType('goog.events.Listenable');

const Action = goog.requireType('os.ui.action.Action');


/**
 * @interface
 * @extends {Listenable}
 * @extends {IDisposable}
 */
class ITimelineItem {
  /**
   * Get the item's id.
   * @return {string}
   */
  getId() {}

  /**
   * Set the item's id.
   * @param {string} id The ID
   */
  setId(id) {}

  /**
   * If the item is interactive.
   * @return {boolean}
   */
  isInteractive() {}

  /**
   * Set if the item is interactive.
   * @param {boolean} value
   */
  setInteractive(value) {}

  /**
   * Get the D3 x-scale for the item.
   * @return {?d3.Scale}
   */
  getXScale() {}

  /**
   * Set the D3 x-scale for the item.
   * @param {?d3.Scale} scale
   */
  setXScale(scale) {}

  /**
   * Get the menu actions for the item.
   * @return {Array<Action>}
   */
  getActions() {}

  /**
   * Set the menu actions for the item.
   * @param {Array<Action>} actions
   */
  setActions(actions) {}

  /**
   * Set the snap function for the item.
   * @param {?function(number):number} snapFunc The rounding function
   */
  setSnap(snapFunc) {}

  /**
   * Get the time extent of the item.
   * @return {Array<number>}
   */
  getExtent() {}

  /**
   * Set the time extent of the item.
   * @param {Array<number>} extent The extent.
   * @param {boolean=} opt_silent Whether or not to fire the brush change event.
   * @param {boolean=} opt_snap Whether or not the given extent should be snapped. Defaults to false.
   */
  setExtent(extent, opt_silent, opt_snap) {}

  /**
   * Get the average time for this item.
   * @return {number}
   */
  getAvg() {}

  /**
   * Get the tool tip.
   * @return {?string} The tool tip.
   */
  getToolTip() {}

  /**
   * Initialize the SVG for the item.
   * @param {d3.Selection} container
   * @param {number} height
   */
  initSVG(container, height) {}

  /**
   * Render the item.
   * @param {number=} opt_height
   */
  render(opt_height) {}
}

exports = ITimelineItem;
