/**
 * Worker control commands. Duplicated to avoid needing to load Closure scripts in a worker.
 * @enum {number}
 */
const JobCommand = {
  'START': 0,
  'STOP': 1,
  'PAUSE': 2
};


/**
 * Worker execution states. Duplicated to avoid needing to load Closure scripts in a worker.
 * @enum {number}
 */
const JobState = {
  'IDLE': 0,
  'EXECUTING': 1,
  'COMPLETE': 2,
  'PAUSED': 3,
  'STOPPED': 4,
  'ERROR': 5,
  'LOG': 6
};


// Default time to "execute" the job before firing the complete event.
const defaultTimeout = 100;

let timeoutId;
let timeoutOverride;

let state = JobState.IDLE;
const startExecution = function() {
  // start the job (delay) if it hasn't been already
  if (state != JobState.EXECUTING) {
    state = JobState.EXECUTING;
    postMessage({state: state});

    timeoutId = setTimeout(() => {
      timeoutId = undefined;
      postMessage({state: JobState.COMPLETE});
    }, timeoutOverride || defaultTimeout);
  }
};

const stopExecution = function() {
  // stop the job (delay) if it is running and fire a stopped event, then
  // close the worker
  if (timeoutId != null) {
    clearTimeout(timeoutId);
    timeoutId = undefined;

    state = JobState.STOPPED;
    postMessage({state: state});

    self.close();
  }
};

const pauseExecution = function() {
  // pause execution of the job. starting will actually reset the delay but
  // this is just a test, so that's not a problem.
  if (state == JobState.EXECUTING && timeoutId != null) {
    clearTimeout(timeoutId);
    timeoutId = undefined;

    state = JobState.PAUSED;
    postMessage({state: state});
  }
};

onmessage = function(event) {
  // handle messages from the parent {os.job.Job}
  if (event && event.data) {
    const data = event.data;
    if (data.command == JobCommand.START) {
      timeoutOverride = typeof data.data === 'number' ? data.data : undefined;

      startExecution();
    } else if (data.command == JobCommand.STOP) {
      stopExecution();
    } else if (data.command == JobCommand.PAUSE) {
      pauseExecution();
    }
  }
};
