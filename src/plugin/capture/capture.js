goog.module('plugin.capture');

const Timer = goog.require('goog.Timer');
const googArray = goog.require('goog.array');
const MapContainer = goog.require('os.MapContainer');
const {
  getMapCanvas: getMapCanvasBase,
  getMapPixelRatio: getMapPixelRatioBase
} = goog.require('os.capture');
const TimelineController = goog.require('os.time.TimelineController');

const ILayer = goog.requireType('os.layer.ILayer');


/**
 * Default wait time to check if the map is ready, in milliseconds.
 * @type {number}
 */
const WAIT_TIME = 100;

/**
 * Get the map canvas element.
 * @return {HTMLCanvasElement} The map canvas element
 * @deprecated Please use os.capture.getMapCanvas instead.
 */
const getMapCanvas = getMapCanvasBase;

/**
 * Get the map canvas pixel ratio.
 * @return {number} The map canvas pixel ratio.
 * @deprecated Please use os.capture.getMapPixelRatio instead.
 */
const getMapPixelRatio = getMapPixelRatioBase;

/**
 * Check if the application is ready to capture the screen.
 * @param {function()} callback The function to call when ready to capture
 */
const onReady = function(callback) {
  // Check if we are ready to take picture
  var ready = googArray.every(MapContainer.getInstance().getLayers(), function(layer) {
    layer = /** @type {ILayer} */ (layer);
    return !layer.isLoading();
  });

  if (ready) {
    // once layers have finished loading, wait another second for histograms, color models, etc to update
    Timer.callOnce(callback, 1000);
  } else {
    // not ready, wait 100ms and try again
    Timer.callOnce(function() {
      onReady(callback);
    }, WAIT_TIME);
  }
};

/**
 * If recording is supported.
 * @return {boolean}
 */
const recordSupported = function() {
  var tlc = TimelineController.getInstance();
  // record is supported when the window is not the same as the loop
  var winRight = tlc.getCurrent();
  var winLeft = winRight - tlc.getOffset();
  var loopStart = tlc.getLoopStart();
  var loopEnd = tlc.getLoopEnd();

  return winLeft != loopStart || winRight != loopEnd;
};

exports = {
  WAIT_TIME,
  getMapCanvas,
  getMapPixelRatio,
  onReady,
  recordSupported
};
