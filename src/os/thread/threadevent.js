goog.module('os.thread.ThreadEvent');
goog.module.declareLegacyNamespace();

const GoogEvent = goog.require('goog.events.Event');

const IThreadJob = goog.requireType('os.thread.IThreadJob');


/**
 * A thread event
 */
class ThreadEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {string} type The event type
   * @param {IThreadJob} job The job
   */
  constructor(type, job) {
    super(type);

    /**
     * @type {IThreadJob}
     * @private
     */
    this.job_ = job;
  }

  /**
   * Gets the job
   *
   * @return {IThreadJob} The job that caused the event
   */
  getJob() {
    return this.job_;
  }
}

exports = ThreadEvent;
