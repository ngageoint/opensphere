/**
 * Worker to convert a data URL to a Uint8Array.
 */
'use strict';


/**
 * These match up with os.job.JobState, but including that requires using Closure in the worker.
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
 * Clean up
 */
var dispose = function() {
  // This is the easiest way to clean up as it gets rid of everything. However, it also requires
  // you to programmatically create a new job if you want to run it again.
  self.close();
};


/**
 * Converts a data URL to a Uint8Array.
 * @param {string} dataUrl The data URL to convert to a Uint8Array
 * @return {Uint8Array} The Uint8Array
 *
 * @see http://code.google.com/p/chromium/issues/detail?id=67587#c57
 */
var toUint8Array = function(dataUrl) {
  var bin = atob(dataUrl.split(',')[1]);
  var len = bin.length;
  var len32 = len >> 2;
  var a8 = new Uint8Array(len);
  var a32 = new Uint32Array(a8.buffer, 0, len32);

  for (var i = 0, j = 0; i < len32; i++) {
    a32[i] = bin.charCodeAt(j++) |
        bin.charCodeAt(j++) << 8 |
        bin.charCodeAt(j++) << 16 |
        bin.charCodeAt(j++) << 24;
  }

  var tailLength = len & 3;
  while (tailLength--) {
    a8[j] = bin.charCodeAt(j++);
  }

  return a8;
};


/**
 * Handle an error in the worker.
 * @param {string} msg The error message
 */
var handleError = function(msg) {
  postMessage({state: State.ERROR, data: msg});
  dispose();
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
    if (inputData && typeof inputData['dataUrl'] == 'string') {
      try {
        var a8 = toUint8Array(inputData['dataUrl']);
        postMessage({state: State.COMPLETE, data: a8});
        dispose();
      } catch (e) {
        handleError(e.message || 'Failed converting data URL');
      }
    }

    handleError('Data URL missing from worker data');
  }

  handleError('Received empty worker message');
};
