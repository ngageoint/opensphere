goog.provide('os.capture.AbstractRecorder');

goog.require('goog.dom.ViewportSizeMonitor');
goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('os.capture.CaptureEventType');
goog.require('os.capture.IRecorder');



/**
 * Abstract class for creating a recording.
 *
 * @implements {os.capture.IRecorder}
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.capture.AbstractRecorder = function() {
  os.capture.AbstractRecorder.base(this, 'constructor');
  this.aborted = false;
  this.data = null;
  this.errorMsg = '';
  this.progress = 0;
  this.status = '';
  this.title = 'Give me a title please';

  /**
   * The video encoder.
   * @type {os.capture.IVideoEncoder}
   * @protected
   */
  this.encoder = null;

  /**
   * The source video frames.
   * @type {!Array<!HTMLCanvasElement>}
   * @protected
   */
  this.frames = [];

  /**
   * The recorder's logger
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.capture.AbstractRecorder.LOGGER_;

  /**
   * Monitor viewport size to abort recording if it changes.
   * @type {goog.dom.ViewportSizeMonitor}
   * @protected
   */
  this.vsm = new goog.dom.ViewportSizeMonitor();
};
goog.inherits(os.capture.AbstractRecorder, goog.events.EventTarget);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.capture.AbstractRecorder.LOGGER_ = goog.log.getLogger('os.capture.AbstractRecorder');


/**
 * @inheritDoc
 */
os.capture.AbstractRecorder.prototype.disposeInternal = function() {
  os.capture.AbstractRecorder.base(this, 'disposeInternal');

  goog.dispose(this.encoder);
  this.encoder = null;

  goog.dispose(this.vsm);
  this.vsm = null;

  this.cleanup();
};


/**
 * @inheritDoc
 */
os.capture.AbstractRecorder.prototype.cleanup = function() {
  // preserve the aborted flag during object disposal
  if (!this.isDisposed()) {
    this.aborted = false;
  }

  this.data = null;
  this.frames.length = 0;
  this.progress = 0;
  this.errorMsg = '';

  if (this.encoder) {
    this.encoder.cleanup();
  }

  if (this.vsm) {
    this.vsm.unlisten(goog.events.EventType.RESIZE, this.onViewportResize, false, this);
  }
};


/**
 * @inheritDoc
 */
os.capture.AbstractRecorder.prototype.init = function() {
  // we need to abort if the browser is resized, or the GIF will be pretty much useless
  if (this.vsm) {
    this.vsm.listenOnce(goog.events.EventType.RESIZE, this.onViewportResize, false, this);
  }
};


/**
 * @inheritDoc
 */
os.capture.AbstractRecorder.prototype.abort = function(opt_msg) {
  if (!this.aborted) {
    this.aborted = true;

    if (this.encoder) {
      this.encoder.abort();
    }

    var msg = opt_msg || 'Recording aborted by user.';
    goog.log.error(this.log, msg);
  }
};


/**
 * @inheritDoc
 */
os.capture.AbstractRecorder.prototype.record = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.capture.AbstractRecorder.prototype.setEncoder = function(value) {
  this.encoder = value;
};


/**
 * Set the error message and dispatch the error event.
 * @param {string} msg The error message
 * @param {Error=} opt_error The caught error
 * @protected
 */
os.capture.AbstractRecorder.prototype.handleError = function(msg, opt_error) {
  if (opt_error) {
    goog.log.error(this.log, this.errorMsg, opt_error);
  }

  this.errorMsg = 'Encountered an error while recording: ' + msg;
  this.abort(this.errorMsg);

  this.dispatchEvent(os.capture.CaptureEventType.ERROR);
};


/**
 * Set the progress for the recorder and fire an event.
 * @param {number} value The new progress value.
 * @protected
 */
os.capture.AbstractRecorder.prototype.setProgress = function(value) {
  this.progress = value;
  this.dispatchEvent(os.capture.CaptureEventType.PROGRESS);
};


/**
 * Set the status for the recorder and fire an event.
 * @param {string} value The new status value.
 * @protected
 */
os.capture.AbstractRecorder.prototype.setStatus = function(value) {
  this.status = value;
  this.dispatchEvent(os.capture.CaptureEventType.STATUS);
};


/**
 * Handle viewport resize.
 * @param {goog.events.Event} event
 * @protected
 */
os.capture.AbstractRecorder.prototype.onViewportResize = function(event) {
  if (!this.aborted) {
    var errorMsg = 'Resizing the browser would result in a distorted recording.';
    this.abort(errorMsg);
    this.handleError(errorMsg);
  }
};
