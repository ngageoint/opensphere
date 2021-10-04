goog.declareModuleId('os.query.ITemporalFormatter');

const {default: TimelineController} = goog.requireType('os.time.TimelineController');


/**
 * Interface for formatting timeline controller start/end date.
 *
 * @interface
 */
export default class ITemporalFormatter {
  /**
   * Format the start/end date of the timeline controller.
   * @param {TimelineController} controller
   * @return {string}
   */
  format(controller) {}
}
