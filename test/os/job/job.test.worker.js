// Import Worker libraries
var CLOSURE_BASE_PATH = '/base/node_modules/google-closure-library/closure/goog/';
importScripts(
    CLOSURE_BASE_PATH + 'bootstrap/webworkers.js',
    CLOSURE_BASE_PATH + 'base.js',
    CLOSURE_BASE_PATH + 'deps.js',
    '/base/src/os/job/jobevent.js',
    '/base/src/os/job/job.js'
);


goog.require('os.job.JobCommand');
goog.require('os.job.JobState');
goog.require('goog.async.Delay');


// This test job will execute for 500ms before firing a complete event
var delayOverride = undefined;
var delay = new goog.async.Delay(function(event) {
  postMessage({state: os.job.JobState.COMPLETE});
}, 100, this);

var state = os.job.JobState.IDLE;
var startExecution = function() {
  // start the job (delay) if it hasn't been already
  if (state != os.job.JobState.EXECUTING) {
    state = os.job.JobState.EXECUTING;
    postMessage({state: state});

    delay.start(delayOverride);
  }
};

var stopExecution = function() {
  // stop the job (delay) if it is running and fire a stopped event, then
  // close the worker
  if (delay.isActive()) {
    delay.stop();

    state = os.job.JobState.STOPPED;
    postMessage({state: state});

    self.close();
  }
};

var pauseExecution = function() {
  // pause execution of the job. starting will actually reset the delay but
  // this is just a test, so that's not a problem.
  if (state == os.job.JobState.EXECUTING && delay.isActive()) {
    delay.stop();
    state = os.job.JobState.PAUSED;
    postMessage({state: state});
  }
};

onmessage = function(event) {
  // handle messages from the parent {os.job.Job}
  if (event && event.data) {
    var data = event.data;
    if (data.command == os.job.JobCommand.START) {
      if (data.data) {
        delayOverride = data.data;
      }
      startExecution();
    } else if (data.command == os.job.JobCommand.STOP) {
      stopExecution();
    } else if (data.command == os.job.JobCommand.PAUSE) {
      pauseExecution();
    }
  }
};
