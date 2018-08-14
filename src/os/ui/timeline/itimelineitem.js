goog.provide('os.ui.timeline.ITimelineItem');
goog.require('goog.disposable.IDisposable');
goog.require('goog.events.Listenable');



/**
 * @interface
 * @extends {goog.events.Listenable}
 * @extends {goog.disposable.IDisposable}
 */
os.ui.timeline.ITimelineItem = function() {};


/**
 * @return {string}
 */
os.ui.timeline.ITimelineItem.prototype.getId = goog.abstractMethod;


/**
 * @param {string} id The ID
 */
os.ui.timeline.ITimelineItem.prototype.setId;


/**
 * @return {boolean}
 */
os.ui.timeline.ITimelineItem.prototype.isInteractive = goog.abstractMethod;


/**
 * @param {boolean} value
 */
os.ui.timeline.ITimelineItem.prototype.setInteractive;


/**
 * @return {?d3.Scale}
 */
os.ui.timeline.ITimelineItem.prototype.getXScale = goog.abstractMethod;


/**
 * @param {?d3.Scale} scale
 */
os.ui.timeline.ITimelineItem.prototype.setXScale;


/**
 * @return {Array<os.ui.action.Action>}
 */
os.ui.timeline.ITimelineItem.prototype.getActions = goog.abstractMethod;


/**
 * @param {Array<os.ui.action.Action>} actions
 */
os.ui.timeline.ITimelineItem.prototype.setActions;


/**
 * @param {?function(number):number} snapFunc The rounding function
 */
os.ui.timeline.ITimelineItem.prototype.setSnap;


/**
 * Gets the time extent of the item
 * @return {Array.<number>}
 */
os.ui.timeline.ITimelineItem.prototype.getExtent = goog.abstractMethod;


/**
 * Gets the average time for this item
 * @return {number}
 */
os.ui.timeline.ITimelineItem.prototype.getAvg = goog.abstractMethod;


/**
 * Initialize the SVG for the item
 * @param {d3.Selection} container
 * @param {number} height
 */
os.ui.timeline.ITimelineItem.prototype.initSVG;


/**
 * Renders the item
 * @param {number=} opt_height
 */
os.ui.timeline.ITimelineItem.prototype.render;
