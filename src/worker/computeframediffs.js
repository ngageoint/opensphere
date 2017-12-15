/**
 * Worker to compute differences in image frames.
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
 * Processes a set of image frames for use in a GIF. Frames are compared and pixels that do not change between frames
 * are set to transparent (black).
 *
 * @param {!Array<!ImageData>} frames The frames to compare. Frames past the first should be duplicated so they can be
 *                                    manipulated directly.
 * @return {!Array<!ImageData>} The processed frames
 */
var computeDiffs = function(frames) {
  var diffs = [frames[0]];
  for (var i = 0; i < frames.length - 1; i += 2) {
    diffs.push(getFrameDiff(frames[i], frames[i + 1]));
  }
  return diffs;
};


/**
 * Get frame diffs
 *
 * From wallw:
 * This is currently done in a manual fashion. I think it might be faster to do
 * it as the frames are recorded using a blank canvas and blend modes or shaders.
 * Although I can't think of a blend mode out of the box that would give you
 * if (pixel1 same color as pixel2) then transparent.
 *
 * Check to see what percentage of the overall processing time this method takes.
 *
 * @param {!ImageData} frame1
 * @param {!ImageData} frame2
 * @return {!ImageData}
 */
var getFrameDiff = function(frame1, frame2) {
  for (var i = 0; i < frame1.data.length; i += 4) {
    // check if RGB are equal, ignore alpha
    if ((frame1.data[i] == frame2.data[i]) && (frame1.data[i + 1] == frame2.data[i + 1]) &&
        (frame1.data[i + 2] == frame2.data[i + 2])) {
      // frames were the same - set as transparent
      frame2.data[i] = 0;
      frame2.data[i + 1] = 0;
      frame2.data[i + 2] = 0;
      frame2.data[i + 3] = 0;
    }
  }

  return frame2;
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
    var workerData = msg.data;
    var inputData = workerData.data;
    if (inputData && inputData.frames) {
      try {
        var diffs = computeDiffs(inputData.frames);
        postMessage({state: State.COMPLETE, data: diffs});
        dispose();
      } catch (e) {
        handleError(e.message || 'Failed comparing frames');
      }
    }

    handleError('Frames missing from worker data');
  }

  handleError('Received empty worker message');
};
