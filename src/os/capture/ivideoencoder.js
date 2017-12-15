goog.provide('os.capture.IVideoEncoder');

goog.require('goog.events.Listenable');



/**
 * Interface for saving video frames to a file.
 * @interface
 * @extends {goog.events.Listenable}
 */
os.capture.IVideoEncoder = function() {};


/**
 * User-facing description of the video encoder.
 * @type {string}
 */
os.capture.IVideoEncoder.prototype.description;


/**
 * Detailed error message if encoding fails.
 * @type {string}
 */
os.capture.IVideoEncoder.prototype.errorMsg;


/**
 * The file extension for encoded videos.
 * @type {string}
 */
os.capture.IVideoEncoder.prototype.extension;


/**
 * Final video output.
 * @type {*}
 */
os.capture.IVideoEncoder.prototype.output;


/**
 * Progress percentage for the current task.
 * @type {number}
 */
os.capture.IVideoEncoder.prototype.progress;


/**
 * Encoder status message.
 * @type {string}
 */
os.capture.IVideoEncoder.prototype.status;


/**
 * User-facing title of the video encoder.
 * @type {string}
 */
os.capture.IVideoEncoder.prototype.title;


/**
 * Abort the encoding process.
 */
os.capture.IVideoEncoder.prototype.abort;


/**
 * Clean up any resources that shouldn't reside in memory.
 */
os.capture.IVideoEncoder.prototype.cleanup;


/**
 * Initialize the encoder.
 * @param {number} frameRate The frame rate of the video
 * @param {number=} opt_quality The video quality, from 0 to 1
 */
os.capture.IVideoEncoder.prototype.init;


/**
 * Process video frames.
 */
os.capture.IVideoEncoder.prototype.process;


/**
 * Set the source frames to use in the video.
 * @param {!Array<!HTMLCanvasElement>} frames The video frames
 */
os.capture.IVideoEncoder.prototype.setFrames;
