goog.declareModuleId('os.job.Job');

import JobCommand from './jobcommand.js';
import JobEvent from './jobevent.js';
import JobEventType from './jobeventtype.js';
import JobState from './jobstate.js';

const Timer = goog.require('goog.Timer');
const EventTarget = goog.require('goog.events.EventTarget');
const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');


/**
 * SEE testWorker.js FOR THE BEST EXAMPLE of how to use this class
 *
 * Wraps and controls a Worker. The Worker is responsible for background
 * execution of a job and must be compiled as a separate source file.
 *
 * Workers should communicate their state back to their parent using
 * postMessage(). An example of the Worker telling the parent it has started
 * executing would look like this:
 *
 * <pre>
 *     postMessage({state: JobState.EXECUTING});
 * </pre>
 *
 * If a Worker needs to send interim data, such as for long-processing jobs,
 * it can send an EXECUTING state with optional result data. Example:
 *
 * <pre>
 *     postMessage({state: os.job.JobState.EXECUTING, data: someData});
 * </pre>
 *
 * The Job will send a JobEvent.DATAREADY event so listeners can display data
 * as it is processed.
 */
export default class Job extends EventTarget {
  /**
   * Constructor.
   * @param {string} src Worker source URI.
   * @param {string} name User-facing name of the job.
   * @param {string} details User-facing description of the job.
   */
  constructor(src, name, details) {
    super();

    /**
     * User-facing name of the job.
     *
     * @protected
     * @type {string}
     */
    this.name = name;

    /**
     * User-facing description of the job.
     *
     * @protected
     * @type {string}
     */
    this.details = details;

    /**
     * Total time this job has been executing.
     * @type {number}
     */
    this.executionTime = 0;

    /**
     * Current state of the job.
     * @type {JobState}
     */
    this.state = JobState.IDLE;

    /**
     * Worker source URI.
     *
     * @private
     * @type {string}
     */
    this.source_ = src;

    /**
     * The Worker.
     *
     * @private
     * @type {Worker}
     */
    this.worker_ = new Worker(src);
    this.worker_.onmessage = Job.onMessage.bind(this);

    /**
     * Timer to update job execution time.
     * @private
     * @type {Timer}
     */
    this.executionTimer_ = new Timer(1000);
    this.executionTimer_.listen(Timer.TICK, this.incrementExecutionTime, false, this);
  }

  /**
   * @return {string} Worker source URI.
   */
  getSource() {
    return this.source_;
  }

  /**
   * Get the user-facing name of this job.
   *
   * @return {string} Job name.
   */
  getName() {
    return this.name;
  }

  /**
   * Get the user-facing description of this job.
   *
   * @return {string} Job details.
   */
  getDetails() {
    return this.details;
  }

  /**
   * @param {string} event Timer event.
   * @protected
   */
  incrementExecutionTime(event) {
    this.executionTime++;
  }

  /**
   * Process a message from the Worker.
   *
   * @param {Object} msg Message from the Worker.
   */
  handleWorkerMessage(msg) {
    if (msg['state']) {
      var oldState = this.state;

      switch (msg['state']) {
        case JobState.IDLE:
          this.state = msg['state'];
          this.executionTimer_.stop();
          break;
        case JobState.EXECUTING:
          this.state = msg['state'];
          this.executionTimer_.start();
          if (msg['data']) {
            this.dispatchEvent(new JobEvent(JobEventType.DATAREADY, msg['data']));
          }
          break;
        case JobState.PAUSED:
          this.state = msg['state'];
          this.executionTimer_.stop();
          break;
        case JobState.STOPPED:
          this.state = msg['state'];
          this.executionTimer_.stop();
          this.dispatchEvent(new JobEvent(JobEventType.COMPLETE));
          break;
        case JobState.COMPLETE:
          this.state = msg['state'];
          this.executionTimer_.stop();
          this.dispatchEvent(new JobEvent(JobEventType.COMPLETE, msg['data']));
          break;
        case JobState.ERROR:
          this.state = msg['state'];
          this.executionTimer_.stop();
          this.dispatchEvent(new JobEvent(JobEventType.ERROR, msg['data']));
          break;
        case JobState.LOG:
          if (msg['data'] && msg['level'] &&
              log.hasOwnProperty(msg['level'])) {
            var logMsg = '[' + this.name + '] ' + msg['data'];
            log[msg['level']](logger, logMsg);
          }
          break;
        default:
          // Shouldn't get here...
          break;
      }

      if (oldState != msg['state']) {
        this.dispatchEvent(new JobEvent(JobEventType.CHANGE));
      }
    }
  }

  /**
   * Start the job with the supplied data.
   *
   * @param {Object=} opt_data Data to pass to the worker.
   */
  startExecution(opt_data) {
    var workerOpts = {
      'command': JobCommand.START,
      'data': opt_data
    };

    this.worker_.postMessage(workerOpts);
  }

  /**
   * Stop execution of the job.
   */
  stopExecution() {
    this.worker_.postMessage({'command': JobCommand.STOP});
  }

  /**
   * Pause execution of the Worker.
   */
  pauseExecution() {
    this.worker_.postMessage({'command': JobCommand.PAUSE});
  }

  /**
   * Worker message handler. Context for 'this' will be the Job.
   * @param {string|Object} event Message from the Worker.
   *
   * @this Job
   * @protected
   */
  static onMessage(event) {
    if (event && event.data) {
      this.handleWorkerMessage(event.data);
    }
  }
}

/**
 * Logger for this object.
 * @type {Logger}
 */
const logger = log.getLogger('os.job.Job');
