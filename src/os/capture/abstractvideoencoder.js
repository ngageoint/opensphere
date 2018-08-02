goog.provide('os.capture.AbstractVideoEncoder');

goog.require('goog.events.EventTarget');
goog.require('goog.html.TrustedResourceUrl');
goog.require('goog.log');
goog.require('goog.net.jsloader');
goog.require('goog.string.Const');
goog.require('os.capture.IVideoEncoder');



/**
 * Abstract class for exporting a video.
 * @extends {goog.events.EventTarget}
 * @implements {os.capture.IVideoEncoder}
 * @constructor
 */
os.capture.AbstractVideoEncoder = function() {
  os.capture.AbstractVideoEncoder.base(this, 'constructor');

  // os.capture.IVideoEncoder interface properties
  this.description = '';
  this.extension = 'unknown';
  this.errorMsg = '';
  this.output = null;
  this.progress = 0;
  this.status = '';
  this.title = 'Give me a title!';

  /**
   * The original canvas frames.
   * @type {!Array<!HTMLCanvasElement>}
   * @protected
   */
  this.frames = [];

  /**
   * The logger for the exporter.
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.capture.AbstractVideoEncoder.LOGGER_;

  /**
   * The encoder script URL, if it should be lazy loaded.
   * @type {string|undefined}
   * @protected
   */
  this.scriptUrl = undefined;
};
goog.inherits(os.capture.AbstractVideoEncoder, goog.events.EventTarget);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.capture.AbstractVideoEncoder.LOGGER_ = goog.log.getLogger('os.capture.AbstractVideoEncoder');


/**
 * The default video quality.
 * @type {number}
 * @const
 */
os.capture.AbstractVideoEncoder.DEFAULT_QUALITY = 1.0;


/**
 * @inheritDoc
 */
os.capture.AbstractVideoEncoder.prototype.disposeInternal = function() {
  os.capture.AbstractVideoEncoder.base(this, 'disposeInternal');
  this.cleanup();
};


/**
 * @inheritDoc
 */
os.capture.AbstractVideoEncoder.prototype.abort = goog.nullFunction;


/**
 * @inheritDoc
 */
os.capture.AbstractVideoEncoder.prototype.cleanup = function() {
  this.frames.length = 0;
  this.output = null;
};


/**
 * @inheritDoc
 */
os.capture.AbstractVideoEncoder.prototype.init = function(frameRate, opt_quality) {
  this.cleanup();

  this.frameRate = frameRate;
  this.quality = opt_quality || os.capture.AbstractVideoEncoder.DEFAULT_QUALITY;
};


/**
 * @inheritDoc
 */
os.capture.AbstractVideoEncoder.prototype.process = function() {
  if (!this.isEncoderLoaded()) {
    if (this.scriptUrl) {
      var trustedUrl = goog.html.TrustedResourceUrl.fromConstant(os.string.createConstant(this.scriptUrl));
      goog.net.jsloader.safeLoad(trustedUrl).addCallbacks(this.processInternal, this.onScriptLoadError, this);
    } else {
      this.handleError(this.title + ' encoder is not available');
    }
  } else {
    this.processInternal();
  }
};


/**
 * Process the video frames once the encoder has been loaded.
 * @protected
 */
os.capture.AbstractVideoEncoder.prototype.processInternal = goog.abstractMethod;


/**
 * If the encoder library has been loaded in the browser.
 * @return {boolean}
 * @protected
 */
os.capture.AbstractVideoEncoder.prototype.isEncoderLoaded = function() {
  // by default, assume the library is loaded in the index.html
  return true;
};


/**
 * Set the error message and dispatch the error event.
 * @param {string} msg The error message
 * @param {Error=} opt_error The caught error
 * @protected
 */
os.capture.AbstractVideoEncoder.prototype.handleError = function(msg, opt_error) {
  if (opt_error) {
    goog.log.error(this.log, this.errorMsg, opt_error);
  }

  this.errorMsg = 'Encountered an error while exporting video: ' + msg;

  this.dispatchEvent(os.capture.CaptureEventType.ERROR);
};


/**
 * Handle failure to load the encoder library.
 * @param {goog.net.jsloader.Error} error The error
 * @protected
 */
os.capture.AbstractVideoEncoder.prototype.onScriptLoadError = function(error) {
  this.scriptUrl = undefined;
  this.handleError(error ? error.message : 'failed to load the ' + this.title + ' encoder');
};


/**
 * @inheritDoc
 */
os.capture.AbstractVideoEncoder.prototype.setFrames = function(frames) {
  this.frames = frames;
};


/**
 * Set the progress for the export process and fire an event.
 * @param {number} value The new progress value.
 * @protected
 */
os.capture.AbstractVideoEncoder.prototype.setProgress = function(value) {
  this.progress = value;
  this.dispatchEvent(os.capture.CaptureEventType.PROGRESS);
};


/**
 * Set the status for the export process and fire an event.
 * @param {string} value The new status value.
 * @protected
 */
os.capture.AbstractVideoEncoder.prototype.setStatus = function(value) {
  this.status = value;
  this.dispatchEvent(os.capture.CaptureEventType.STATUS);
};
