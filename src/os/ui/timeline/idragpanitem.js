goog.module('os.ui.timeline.IDragPanItem');
goog.module.declareLegacyNamespace();

const ITimelineItem = goog.requireType('os.ui.timeline.ITimelineItem');


/**
 * @interface
 * @extends {ITimelineItem}
 */
class IDragPanItem {
  /**
   * @param {number} t
   */
  dragPanTo(t) {}
}

exports = IDragPanItem;
