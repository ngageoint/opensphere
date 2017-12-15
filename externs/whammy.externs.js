/**
 * @fileoverview Externs for the Whammy WebM encoder library.
 * @externs
 */


/**
 * Namespace for typedefs.
 * @type {Object}
 */
var Whammy = {};



/**
 * Whammy library constructor.
 * @param {number} frameRate
 * @param {number=} opt_quality
 * @constructor
 */
Whammy.Video = function(frameRate, opt_quality) {};


/**
 * Add a frame to the video.
 * @param {!(CanvasRenderingContext2D|HTMLCanvasElement|string)} frame The video frame
 * @param {number=} opt_duration The duration to display the frame
 */
Whammy.Video.prototype.add = function(frame, opt_duration) {};


/**
 * Compile the video.
 * @param {boolean} outputAsArray If the output should be converted to a byte array.
 * @param {function((Blob|Uint8Array))} callback The callback for when the video is ready
 */
Whammy.Video.prototype.compile = function(outputAsArray, callback) {};
