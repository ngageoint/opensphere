goog.provide('os.thread');
goog.provide('os.thread.Thread');
goog.require('goog.async.Delay');
goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.thread.EventType');
goog.require('os.thread.ThreadEvent');
goog.require('os.thread.ThreadProgressEvent');



/**
 * A "pseudo-thread" that facilitates chunked processing
 * @extends {goog.events.EventTarget}
 * @constructor
 * @param {os.thread.IThreadJob} job The job to run
 */
os.thread.Thread = function(job) {
  os.thread.Thread.base(this, 'constructor');

  /**
   * @type {os.thread.IThreadJob}
   * @private
   */
  this.job_ = job;

  /**
   * @type {goog.async.Delay}
   * @private
   */
  this.delay_ = new goog.async.Delay(this.onDelay_, 5, this);
};
goog.inherits(os.thread.Thread, goog.events.EventTarget);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.thread.Thread.LOGGER_ = goog.log.getLogger('os.thread.Thread');


/**
 * @inheritDoc
 */
os.thread.Thread.prototype.disposeInternal = function() {
  os.thread.Thread.superClass_.disposeInternal.call(this);
  this.job_ = null;
  this.delay_.dispose();
  this.delay_ = null;
};


/**
 * Starts the thread
 */
os.thread.Thread.prototype.start = function() {
  this.delay_.start();
  this.dispatchEvent(new os.thread.ThreadEvent(os.thread.EventType.START, this.job_));
};


/**
 * Stops or pauses the thread. Processing may resume by calling <code>start()</code>.
 */
os.thread.Thread.prototype.stop = function() {
  this.delay_.stop();
  this.dispatchEvent(new os.thread.ThreadEvent(os.thread.EventType.STOP, this.job_));
};


/**
 * Terminates the thread and cleans up resources. Processing cannot resume.
 */
os.thread.Thread.prototype.terminate = function() {
  this.delay_.stop();
  this.dispatchEvent(new os.thread.ThreadEvent(os.thread.EventType.COMPLETE, this.job_));
};


/**
 * @return {boolean} Whether or not the thread is determinate.
 */
os.thread.Thread.prototype.isDeterminate = function() {
  return this.job_.getLoaded() > -1 && this.job_.getTotal() > -1;
};


/**
 * Handles timer tick
 * @private
 */
os.thread.Thread.prototype.onDelay_ = function() {
  this.delay_.stop();

  try {
    var done = this.job_.executeNext();
    this.dispatchEvent(new os.thread.ThreadProgressEvent(this.job_.getLoaded(), this.job_.getTotal()));

    if (done) {
      this.terminate();
    } else {
      this.delay_.start();
    }
  } catch (err) {
    if (!this.isDisposed()) {
      this.stop();
    }
    goog.log.error(os.thread.Thread.LOGGER_, 'Thread execution error!', err);
    this.dispatchEvent(new os.thread.ThreadEvent(os.thread.EventType.ERROR, this.job_));
  }
};
