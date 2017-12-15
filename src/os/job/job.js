goog.provide('os.job.Job');
goog.provide('os.job.JobCommand');
goog.provide('os.job.JobState');

goog.require('goog.Timer');
goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.job.JobEvent');
goog.require('os.job.JobEventType');


/**
 * Worker control commands.
 * @enum {number}
 */
os.job.JobCommand = {
  'START': 0,
  'STOP': 1,
  'PAUSE': 2
};
goog.exportSymbol('os.job.JobCommand', os.job.JobCommand);


/**
 * Worker execution states.
 * @enum {number}
 */
os.job.JobState = {
  'IDLE': 0,
  'EXECUTING': 1,
  'COMPLETE': 2,
  'PAUSED': 3,
  'STOPPED': 4,
  'ERROR': 5,
  'LOG': 6
};
goog.exportSymbol('os.job.JobState', os.job.JobState);



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
 *     postMessage({state: os.job.JobState.EXECUTING});
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
 *
 * @extends {goog.events.EventTarget}
 * @constructor
 *
 * @param {string} src Worker source URI.
 * @param {string} name User-facing name of the job.
 * @param {string} details User-facing description of the job.
 */
os.job.Job = function(src, name, details) {
  os.job.Job.base(this, 'constructor');

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
   * @type {os.job.JobState}
   */
  this.state = os.job.JobState.IDLE;

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
  this.worker_.onmessage = os.job.Job.onMessage;
  this.worker_.job = this;

  /**
   * Timer to update job execution time.
   * @private
   * @type {goog.Timer}
   */
  this.executionTimer_ = new goog.Timer(1000);
  this.executionTimer_.listen(goog.Timer.TICK, this.incrementExecutionTime, false, this);
};
goog.inherits(os.job.Job, goog.events.EventTarget);


/**
 * Logger for this object.
 * @type {goog.log.Logger}
 * @const
 * @private
 */
os.job.Job.LOGGER_ = goog.log.getLogger('os.job.Job');


/**
 * @return {string} Worker source URI.
 */
os.job.Job.prototype.getSource = function() {
  return this.source_;
};


/**
 * Get the user-facing name of this job.
 *
 * @return {string} Job name.
 */
os.job.Job.prototype.getName = function() {
  return this.name;
};


/**
 * Get the user-facing description of this job.
 *
 * @return {string} Job details.
 */
os.job.Job.prototype.getDetails = function() {
  return this.details;
};


/**
 * @param {string} event Timer event.
 * @protected
 */
os.job.Job.prototype.incrementExecutionTime = function(event) {
  this.executionTime++;
};


/**
 * Process a message from the Worker.
 *
 * @param {Object} msg Message from the Worker.
 */
os.job.Job.prototype.handleWorkerMessage = function(msg) {
  if (msg['state']) {
    var oldState = this.state;

    switch (msg['state']) {
      case os.job.JobState.IDLE:
        this.state = msg['state'];
        this.executionTimer_.stop();
        break;
      case os.job.JobState.EXECUTING:
        this.state = msg['state'];
        this.executionTimer_.start();
        if (msg['data']) {
          this.dispatchEvent(new os.job.JobEvent(os.job.JobEventType.DATAREADY, msg['data']));
        }
        break;
      case os.job.JobState.PAUSED:
        this.state = msg['state'];
        this.executionTimer_.stop();
        break;
      case os.job.JobState.STOPPED:
        this.state = msg['state'];
        this.executionTimer_.stop();
        this.dispatchEvent(new os.job.JobEvent(os.job.JobEventType.COMPLETE));
        break;
      case os.job.JobState.COMPLETE:
        this.state = msg['state'];
        this.executionTimer_.stop();
        this.dispatchEvent(new os.job.JobEvent(os.job.JobEventType.COMPLETE, msg['data']));
        break;
      case os.job.JobState.ERROR:
        this.state = msg['state'];
        this.executionTimer_.stop();
        this.dispatchEvent(new os.job.JobEvent(os.job.JobEventType.ERROR, msg['data']));
        break;
      case os.job.JobState.LOG:
        if (msg['data'] && msg['level'] &&
            goog.log.hasOwnProperty(msg['level'])) {
          var logMsg = '[' + this.name + '] ' + msg['data'];
          goog.log[msg['level']](os.job.Job.LOGGER_, logMsg);
        }
        break;
      default:
        // Shouldn't get here...
        break;
    }

    if (oldState != msg['state']) {
      this.dispatchEvent(new os.job.JobEvent(os.job.JobEventType.CHANGE));
    }
  }
};


/**
 * Worker message handler. Context for 'this' will be the Worker.
 *
 * @this Worker
 * @protected
 * @param {string|Object} event Message from the Worker.
 */
os.job.Job.onMessage = function(event) {
  if (event && event.data) {
    this.job.handleWorkerMessage(event.data);
  }
};


/**
 * Start the job with the supplied data.
 *
 * @param {Object=} opt_data Data to pass to the worker.
 */
os.job.Job.prototype.startExecution = function(opt_data) {
  var workerOpts = {
    'command': os.job.JobCommand.START,
    'data': opt_data
  };

  this.worker_.postMessage(workerOpts);
};


/**
 * Stop execution of the job.
 */
os.job.Job.prototype.stopExecution = function() {
  this.worker_.postMessage({'command': os.job.JobCommand.STOP});
};


/**
 * Pause execution of the Worker.
 */
os.job.Job.prototype.pauseExecution = function() {
  this.worker_.postMessage({'command': os.job.JobCommand.PAUSE});
};
