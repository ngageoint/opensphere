goog.module('os.job.JobEvent');
goog.module.declareLegacyNamespace();

const GoogEvent = goog.require('goog.events.Event');

/**
 * Job event
 */
class JobEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {string} type The event type
   * @param {*=} opt_data Data from the worker
   */
  constructor(type, opt_data) {
    super(type);

    /**
     * Data from the event
     * @type {*}
     */
    this.data = opt_data;
  }
}

exports = JobEvent;
