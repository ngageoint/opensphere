goog.provide('os.job.JobManager');

goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('os.job.Job');
goog.require('os.job.JobEventType');



/**
 * The JobManager is responsible for maintaining a list of active jobs. Jobs
 * are kept in the list until they complete execution or an error occurs.
 *
 * SEE testWorker.js FOR THE BEST EXAMPLE of how to use this class.
 *
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.job.JobManager = function() {
  os.job.JobManager.base(this, 'constructor');

  /**
   * @type {Array.<os.job.Job>}
   * @private
   */
  this.jobs_ = [];
};
goog.inherits(os.job.JobManager, goog.events.EventTarget);


/**
 * @return {Array.<os.job.Job>} List of current jobs.
 */
os.job.JobManager.prototype.getJobs = function() {
  return this.jobs_;
};


/**
 * Creates a new {@link os.job.Job} and optionally starts it.
 *
 * @param {string} src Source URI for the job's worker.
 * @param {string} name The user-facing name of the job.
 * @param {string} details The user-facing description of the job.
 * @param {boolean=} opt_start If the job should be started; default is false.
 * @param {Object=} opt_data Data to pass to the job, if started.
 *
 * @return {os.job.Job} The job.
 */
os.job.JobManager.prototype.createJob = function(src, name, details, opt_start, opt_data) {
  var job = new os.job.Job(src, name, details);
  job.listenOnce(os.job.JobEventType.COMPLETE, this.handleJobComplete_, false, this);
  job.listenOnce(os.job.JobEventType.ERROR, this.handleJobError_, false, this);

  this.jobs_.push(job);

  if (opt_start) {
    job.startExecution(opt_data);
  }

  return job;
};


/**
 * @param {!os.job.Job} job The job to remove.
 * @private
 */
os.job.JobManager.prototype.removeJob_ = function(job) {
  goog.dispose(job);

  var index = this.jobs_.indexOf(job);
  if (index != -1) {
    this.jobs_.splice(index, 1);
  }
};


/**
 * Event handler for {@link os.job.JobEventType.COMPLETE} events.
 * @param {os.job.JobEvent} event The event.
 * @private
 */
os.job.JobManager.prototype.handleJobComplete_ = function(event) {
  var job = /** @type {os.job.Job} */ (event.target);
  if (job) {
    this.removeJob_(job);
    job = null;
  }
};


/**
 * Event handler for {@link os.job.JobEventType.ERROR} events.
 * @param {os.job.JobEvent} event The event.
 * @private
 */
os.job.JobManager.prototype.handleJobError_ = function(event) {
  var job = /** @type {os.job.Job} */ (event.target);
  if (job) {
    this.removeJob_(job);
    job = null;
  }
};
