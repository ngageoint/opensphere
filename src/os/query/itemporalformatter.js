goog.provide('os.query.ITemporalFormatter');
goog.require('os.time.TimelineController');



/**
 * Interface for formatting timeline controller start/end date.
 * @interface
 */
os.query.ITemporalFormatter = function() {};


/**
 * Format the start/end date of the timeline controller.
 * @param {os.time.TimelineController} controller
 * @return {string}
 */
os.query.ITemporalFormatter.prototype.format;
