goog.module('os.query.ITemporalFormatter');
goog.module.declareLegacyNamespace();

const TimelineController = goog.requireType('os.time.TimelineController');


/**
 * Interface for formatting timeline controller start/end date.
 *
 * @interface
 */
class ITemporalFormatter {
  /**
   * Format the start/end date of the timeline controller.
   * @param {TimelineController} controller
   * @return {string}
   */
  format(controller) {}
}

exports = ITemporalFormatter;
