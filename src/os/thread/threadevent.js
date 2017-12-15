goog.provide('os.thread.ThreadEvent');
goog.require('goog.events.Event');



/**
 * A thread event
 * @param {string} type The event type
 * @param {os.thread.IThreadJob} job The job
 * @extends {goog.events.Event}
 * @constructor
 */
os.thread.ThreadEvent = function(type, job) {
  os.thread.ThreadEvent.base(this, 'constructor', type);

  /**
   * @type {os.thread.IThreadJob}
   * @private
   */
  this.job_ = job;
};
goog.inherits(os.thread.ThreadEvent, goog.events.Event);


/**
 * Gets the job
 * @return {os.thread.IThreadJob} The job that caused the event
 */
os.thread.ThreadEvent.prototype.getJob = function() {
  return this.job_;
};
