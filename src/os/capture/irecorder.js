goog.provide('os.capture.IRecorder');
goog.require('goog.disposable.IDisposable');
goog.require('goog.events.Listenable');



/**
 * Interface for a class that produces a recording.
 * @extends {goog.disposable.IDisposable}
 * @extends {goog.events.Listenable}
 * @interface
 */
os.capture.IRecorder = function() {};


/**
 * If the recording was aborted.
 * @type {boolean}
 */
os.capture.IRecorder.prototype.aborted;


/**
 * Final recording data.
 * @type {*}
 */
os.capture.IRecorder.prototype.data;


/**
 * Detailed error message if the recording fails.
 * @type {string}
 */
os.capture.IRecorder.prototype.errorMsg;


/**
 * Progress percentage for the current task.
 * @type {number}
 */
os.capture.IRecorder.prototype.progress;


/**
 * Recorder status message.
 * @type {string}
 */
os.capture.IRecorder.prototype.status;


/**
 * User-facing title of the recorder.
 * @type {string}
 */
os.capture.IRecorder.prototype.title;


/**
 * Clean up any resources that shouldn't reside in memory.
 */
os.capture.IRecorder.prototype.cleanup;


/**
 * Abort the recording.
 * @param {string=} opt_msg Abort message
 */
os.capture.IRecorder.prototype.abort;


/**
 * Initialize the recorder.
 */
os.capture.IRecorder.prototype.init;


/**
 * Create a recording.
 */
os.capture.IRecorder.prototype.record;


/**
 * Set the encoder used to save recordings.
 * @param {!os.capture.IVideoEncoder} value The encoder to use to save the recording.
 */
os.capture.IRecorder.prototype.setEncoder;
