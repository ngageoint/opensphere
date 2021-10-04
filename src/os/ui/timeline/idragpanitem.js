goog.declareModuleId('os.ui.timeline.IDragPanItem');

const {default: ITimelineItem} = goog.requireType('os.ui.timeline.ITimelineItem');


/**
 * @interface
 * @extends {ITimelineItem}
 */
export default class IDragPanItem {
  /**
   * @param {number} t
   */
  dragPanTo(t) {}
}
