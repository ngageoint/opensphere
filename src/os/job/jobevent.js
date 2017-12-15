goog.provide('os.job.JobEvent');
goog.provide('os.job.JobEventType');
goog.require('goog.events.Event');


/**
 * Job events indicating when data is ready from the Worker, or an error
 * occurred.
 *
 * @enum {string}
 */
os.job.JobEventType = {
  COMPLETE: 'job:complete',
  DATAREADY: 'job:dataready',
  CHANGE: 'job:change',
  ERROR: 'job:error'
};



/**
 * Job event
 * @param {string} type The event type
 * @param {*=} opt_data Data from the worker
 * @extends {goog.events.Event}
 * @constructor
 */
os.job.JobEvent = function(type, opt_data) {
  os.job.JobEvent.base(this, 'constructor', type);

  /**
   * Data from the event
   * @type {*}
   */
  this.data = opt_data;
};
goog.inherits(os.job.JobEvent, goog.events.Event);
