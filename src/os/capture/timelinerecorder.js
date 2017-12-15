goog.provide('os.capture.TimelineRecorder');

goog.require('goog.Promise');
goog.require('goog.log');
goog.require('os.capture');
goog.require('os.capture.AbstractRecorder');
goog.require('os.capture.CaptureEventType');
goog.require('os.time.TimelineController');



/**
 * Records each frame of the timeline controller animation loop from a canvas.
 *
 * @param {os.capture.CanvasFn=} opt_canvasFn Function to get the canvas
 * @param {os.capture.RenderFn=} opt_renderFn Callback to render the canvas
 *
 * @extends {os.capture.AbstractRecorder}
 * @constructor
 */
os.capture.TimelineRecorder = function(opt_canvasFn, opt_renderFn) {
  os.capture.TimelineRecorder.base(this, 'constructor');
  this.log = os.capture.TimelineRecorder.LOGGER_;
  this.title = 'Record Timeline';

  /**
   * The function to get the canvas element
   * @type {?os.capture.CanvasFn}
   * @private
   */
  this.canvasFn_ = opt_canvasFn || os.capture.getDefaultCanvas;

  /**
   * Function to render the canvas
   * @type {?os.capture.RenderFn}
   * @private
   */
  this.renderFn_ = opt_renderFn || null;

  /**
   * The timeline controller to use for the recording loop
   * @type {!os.time.TimelineController}
   * @private
   */
  this.tlc_ = os.time.TimelineController.getInstance();

  /**
   * Promise for the current recording step.
   * @type {goog.Promise}
   * @private
   */
  this.promise_ = null;
};
goog.inherits(os.capture.TimelineRecorder, os.capture.AbstractRecorder);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.capture.TimelineRecorder.LOGGER_ = goog.log.getLogger('os.capture.TimelineRecorder');


/**
 * @inheritDoc
 */
os.capture.TimelineRecorder.prototype.disposeInternal = function() {
  os.capture.TimelineRecorder.base(this, 'disposeInternal');

  this.canvasFn_ = null;
  this.renderFn_ = null;
};


/**
 * @inheritDoc
 */
os.capture.TimelineRecorder.prototype.cleanup = function() {
  os.capture.TimelineRecorder.base(this, 'cleanup');

  if (this.promise_) {
    this.promise_.cancel();
    this.promise_ = null;
  }
};


/**
 * @inheritDoc
 */
os.capture.TimelineRecorder.prototype.abort = function(opt_msg) {
  var hasAborted = this.aborted;
  os.capture.TimelineRecorder.base(this, 'abort', opt_msg);

  if (!hasAborted) {
    if (this.promise_) {
      this.promise_.cancel();
      this.promise_ = null;
    }
  }
};


/**
 * @inheritDoc
 */
os.capture.TimelineRecorder.prototype.record = function() {
  this.canvasFn_().then(function(canvas) {
    if (canvas) {
      this.cleanup();
      this.init();

      // TODO: can't provide granularity on frames yet, so show indeterminate loading bar
      this.setProgress(-1);
      this.processNextFrame_();
    } else {
      this.handleError('no canvas to record');
    }
  }, this.onCaptureError_, this);
};


/**
 * Render the next frame to record.
 * @return {!goog.Promise}
 * @private
 */
os.capture.TimelineRecorder.prototype.renderFrame_ = function() {
  return this.renderFn_ ? this.renderFn_() : goog.Promise.resolve();
};


/**
 * Handle the next frame in the recording.
 * @private
 */
os.capture.TimelineRecorder.prototype.processNextFrame_ = function() {
  if (!this.errorMsg && !this.aborted) {
    if (this.frames.length === 0) {
      this.tlc_.first();
    } else if (this.tlc_.hasNext()) {
      this.tlc_.next();
    } else {
      this.process_();
      return;
    }

    this.setStatus('Waiting for frame to render...');

    // render the frame first to make sure the canvas is up to date
    this.promise_ = this.renderFrame_().then(function() {
      this.setStatus('Generating image frame...');

      this.canvasFn_().then(function(canvas) {
        if (canvas) {
          this.frames.push(canvas);

          // keep calling until we have all the frames
          this.processNextFrame_();
        } else {
          this.handleError('failed retrieving canvas frame');
        }
      }, this.onCaptureError_, this);
    }, this.onCaptureError_, this);
  }
};


/**
 * Handle rejected promise while generating a canvas frame.
 * @param {*} e
 * @private
 */
os.capture.TimelineRecorder.prototype.onCaptureError_ = function(e) {
  if (!this.aborted) {
    var errorMsg = 'Failed retrieving canvas frame:';
    var error;
    if (e instanceof Error) {
      error = e;
    } else if (typeof e == 'string') {
      errorMsg += ' ' + e;
    } else {
      errorMsg += ' unspecified error.';
    }

    this.handleError(errorMsg, error);
  }
};


/**
 * Process the generated canvas frames.
 * @private
 */
os.capture.TimelineRecorder.prototype.process_ = function() {
  if (this.encoder) {
    this.encoder.listen(os.capture.CaptureEventType.PROGRESS, this.onExportProgress_, false, this);
    this.encoder.listen(os.capture.CaptureEventType.STATUS, this.onExportStatus_, false, this);
    this.encoder.listenOnce(os.capture.CaptureEventType.COMPLETE, this.onExportComplete_, false, this);
    this.encoder.listenOnce(os.capture.CaptureEventType.ERROR, this.onExportError_, false, this);

    if (this.vsm) { // stop listening for resize
      this.vsm.unlisten(goog.events.EventType.RESIZE, this.onViewportResize, false, this);
    }
    this.dispatchEvent(os.capture.CaptureEventType.UNBLOCK);
    this.encoder.init(this.tlc_.getFps());
    this.encoder.setFrames(this.frames);
    this.encoder.process();
  } else {
    this.handleError('no video export format provided');
  }
};


/**
 * Handle video exporter progress event.
 * @param {goog.events.Event} event
 * @private
 */
os.capture.TimelineRecorder.prototype.onExportProgress_ = function(event) {
  var exporter = /** @type {os.capture.IVideoEncoder} */ (event.target);
  if (exporter) {
    this.setProgress(exporter.progress);
  }
};


/**
 * Handle video exporter status event.
 * @param {goog.events.Event} event
 * @private
 */
os.capture.TimelineRecorder.prototype.onExportStatus_ = function(event) {
  var exporter = /** @type {os.capture.IVideoEncoder} */ (event.target);
  if (exporter) {
    this.setStatus(exporter.status);
  }
};


/**
 * Handle video exporter complete.
 * @param {goog.events.Event} event
 * @private
 */
os.capture.TimelineRecorder.prototype.onExportComplete_ = function(event) {
  var exporter = /** @type {os.capture.IVideoEncoder} */ (event.target);
  if (exporter) {
    this.data = exporter.output;
    this.setStatus('Done!');
    this.dispatchEvent(os.capture.CaptureEventType.COMPLETE);
  }
};


/**
 * Handle video exporter error.
 * @param {goog.events.Event} event
 * @private
 */
os.capture.TimelineRecorder.prototype.onExportError_ = function(event) {
  var exporter = /** @type {os.capture.IVideoEncoder} */ (event.target);
  if (exporter && exporter.errorMsg) {
    this.handleError(exporter.errorMsg);
  } else {
    // hopefully we don't get here... haven't encountered it yet
    this.handleError('Unable to create recording: video export failed unexpectedly.');
  }
};
