/*
To start this job, try the following in the console:

// use the job manager
var job = jobManager.createJob('path/to/testWorker.js', 'Test', 'Testing');

// or just use a job directly if you don't care to maintain the list of jobs
var job = new os.job.Job('path/to/testWorker.js', 'Test', 'Testing');

var listener = function(e) {
  console.log(e.type + ' ' + JSON.stringify(e.data));
};
job.listen(os.job.JobEventType.DATAREADY, listener);
job.listen(os.job.JobEventType.COMPLETE, listener);
job.startExecution({
  max: 15,
  interval: 300
});

*/

/**
 * BEGIN Boilerplate Worker code
 */


/**
 * These match up with os.job.JobState, but I didn't want to include that file
 * @enum {string}
 */
var State = {
  'IDLE': 0,
  'EXECUTING': 1,
  'COMPLETE': 2,
  'PAUSED': 3,
  'STOPPED': 4,
  'ERROR': 5,
  'LOG': 6
};


/**
 * These match up with os.job.JobCommand, but I didn't want to include the file
 * @enum {string}
 */
var Command = {
  'START': 0,
  'STOP': 1,
  'PAUSE': 2
};


/**
 * Clean up
 */
var dispose = function() {
  // This is the easiest way to clean up as it gets rid of everything. However, it also requires
  // you to programmatically create a new job if you want to run it again.
  self.close();
};


/**
 * Starts the job
 */
var start = function() {
  state = State.EXECUTING;
  postMessage({state: state});
};


/**
 * Pauses the job. There are no events for this on the other end.
 */
var pause = function() {
  if (state === State.EXECUTING) {
    state = State.PAUSED;
    postMessage({state: state});
  }
};


/**
 * Stops the job (will cause a job COMPLETE event on the other end).
 */
var stop = function() {
  state = State.STOPPED;
  postMessage({state: state});
  dispose();
};


/**
 * @param {Object} input The input data to the worker
 */
var configure = function(input) {
  // set up your own inputs here
};


/**
 * Handle messages sent to the worker
 * @param {Object} msg The message
 * @this Worker
 */
self.onmessage = function(msg) {
  if (msg) {
    var workerData = msg['data'];
    var inputData = workerData['data'];

    if (inputData) {
      configure(inputData);
    }

    switch (workerData['command']) {
      case Command.START:
        start();
        break;
      case Command.PAUSE:
        pause();
        break;
      case Command.STOP:
        stop();
        break;
      default:
        break;
    }
  }
};

/**
 * END Boilerplate Worker code
 */

/**
 * BEGIN Worker/Job Example
 */

// the variables we will use for processing in the worker
var timeout = null;
var state = 0;
var count = 0;
var max = 10;
var interval = 250;


var oldPause = pause;

/**
 * Override to clear the timeout on pause. Note that typically you would just
 * add to the pause function in the boilerplate code above, but I wanted that
 * to be pasteable without the extra stuff for this example.
 */
pause = function() {
  if (timeout) {
    clearTimeout(timeout);
  }
  oldPause();
};


var oldStart = start;

/**
 * Override to start the timeout on start. Note that typically you would just
 * add to the start function in the boilerplate code above, but I wanted that
 * to be pasteable without the extra stuff for this example.
 */
start = function() {
  oldStart();
  timeout = setTimeout(process, interval);
};


/**
 * Override to set up the inputs. Note that typically you would just
 * add to the configure function in the boilerplate code above, but I wanted that
 * to be pasteable without the extra stuff for this example.
 * @param {Object} input The input
 */
configure = function(input) {
  max = input.max !== undefined ? input.max : max;
  interval = input.interval !== undefined ? input.interval : interval;
};


/**
 * Do our "processing", which in the test worker here just increments
 * a counter and then waits for the specified interval before doing it
 * again. Most complex processing will still want to do chunked processing
 * inside a worker so that the worker is not starved from processing
 * incoming messages like STOP or PAUSE commands.
 */
var process = function() {
  count++;
  var data = {count: count, total: max};
  postMessage({state: state, data: data});

  if (count < max) {
    timeout = setTimeout(process, interval);
  } else {
    state = State.COMPLETE;
    postMessage({state: state, data: data});
    dispose();
  }
};

