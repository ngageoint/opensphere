goog.provide('os.ui.timeline.IDragPanItem');
goog.require('os.ui.timeline.ITimelineItem');



/**
 * @interface
 * @extends {os.ui.timeline.ITimelineItem}
 */
os.ui.timeline.IDragPanItem = function() {};


/**
 * @param {number} t
 */
os.ui.timeline.IDragPanItem.prototype.dragPanTo;
