goog.declareModuleId('os.thread.ThreadEvent');

const GoogEvent = goog.require('goog.events.Event');

const {default: IThreadJob} = goog.requireType('os.thread.IThreadJob');


/**
 * A thread event
 */
export default class ThreadEvent extends GoogEvent {
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
