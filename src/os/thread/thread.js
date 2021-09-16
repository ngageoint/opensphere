goog.module('os.thread.Thread');

const Delay = goog.require('goog.async.Delay');
const EventTarget = goog.require('goog.events.EventTarget');
const log = goog.require('goog.log');
const EventType = goog.require('os.thread.EventType');
const ThreadEvent = goog.require('os.thread.ThreadEvent');
const ThreadProgressEvent = goog.require('os.thread.ThreadProgressEvent');

const Logger = goog.requireType('goog.log.Logger');
const IThreadJob = goog.requireType('os.thread.IThreadJob');


/**
 * A "pseudo-thread" that facilitates chunked processing
 */
class Thread extends EventTarget {
  /**
   * Constructor.
   * @param {IThreadJob} job The job to run
   */
  constructor(job) {
    super();

    /**
     * @type {IThreadJob}
     * @private
     */
    this.job_ = job;

    /**
     * @type {Delay}
     * @private
     */
    this.delay_ = new Delay(this.onDelay_, 5, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    this.job_ = null;
    this.delay_.dispose();
    this.delay_ = null;
  }

  /**
   * Starts the thread
   */
  start() {
    this.delay_.start();
    this.dispatchEvent(new ThreadEvent(EventType.START, this.job_));
  }

  /**
   * Stops or pauses the thread. Processing may resume by calling <code>start()</code>.
   */
  stop() {
    this.delay_.stop();
    this.dispatchEvent(new ThreadEvent(EventType.STOP, this.job_));
  }

  /**
   * Terminates the thread and cleans up resources. Processing cannot resume.
   */
  terminate() {
    this.delay_.stop();
    this.dispatchEvent(new ThreadEvent(EventType.COMPLETE, this.job_));
  }

  /**
   * @return {boolean} Whether or not the thread is determinate.
   */
  isDeterminate() {
    return this.job_.getLoaded() > -1 && this.job_.getTotal() > -1;
  }

  /**
   * Handles timer tick
   *
   * @private
   */
  onDelay_() {
    this.delay_.stop();

    try {
      var done = this.job_.executeNext();
      this.dispatchEvent(new ThreadProgressEvent(this.job_.getLoaded(), this.job_.getTotal()));

      if (done) {
        this.terminate();
      } else {
        this.delay_.start();
      }
    } catch (err) {
      if (!this.isDisposed()) {
        this.stop();
      }
      log.error(logger, 'Thread execution error!', err);
      this.dispatchEvent(new ThreadEvent(EventType.ERROR, this.job_));
    }
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.thread.Thread');

exports = Thread;
