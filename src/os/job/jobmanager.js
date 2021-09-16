goog.module('os.job.JobManager');

const EventTarget = goog.require('goog.events.EventTarget');
const Job = goog.require('os.job.Job');
const JobEventType = goog.require('os.job.JobEventType');


/**
 * The JobManager is responsible for maintaining a list of active jobs. Jobs
 * are kept in the list until they complete execution or an error occurs.
 *
 * SEE testWorker.js FOR THE BEST EXAMPLE of how to use this class.
 */
class JobManager extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {Array<Job>}
     * @private
     */
    this.jobs_ = [];
  }

  /**
   * @return {Array<Job>} List of current jobs.
   */
  getJobs() {
    return this.jobs_;
  }

  /**
   * Creates a new {@link Job} and optionally starts it.
   *
   * @param {string} src Source URI for the job's worker.
   * @param {string} name The user-facing name of the job.
   * @param {string} details The user-facing description of the job.
   * @param {boolean=} opt_start If the job should be started; default is false.
   * @param {Object=} opt_data Data to pass to the job, if started.
   *
   * @return {Job} The job.
   */
  createJob(src, name, details, opt_start, opt_data) {
    var job = new Job(src, name, details);
    job.listenOnce(JobEventType.COMPLETE, this.handleJobComplete_, false, this);
    job.listenOnce(JobEventType.ERROR, this.handleJobError_, false, this);

    this.jobs_.push(job);

    if (opt_start) {
      job.startExecution(opt_data);
    }

    return job;
  }

  /**
   * @param {!Job} job The job to remove.
   * @private
   */
  removeJob_(job) {
    goog.dispose(job);

    var index = this.jobs_.indexOf(job);
    if (index != -1) {
      this.jobs_.splice(index, 1);
    }
  }

  /**
   * Event handler for {@link JobEventType.COMPLETE} events.
   *
   * @param {JobEvent} event The event.
   * @private
   */
  handleJobComplete_(event) {
    var job = /** @type {Job} */ (event.target);
    if (job) {
      this.removeJob_(job);
      job = null;
    }
  }

  /**
   * Event handler for {@link JobEventType.ERROR} events.
   *
   * @param {JobEvent} event The event.
   * @private
   */
  handleJobError_(event) {
    var job = /** @type {Job} */ (event.target);
    if (job) {
      this.removeJob_(job);
      job = null;
    }
  }
}

exports = JobManager;
