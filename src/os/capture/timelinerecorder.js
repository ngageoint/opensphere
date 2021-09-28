goog.declareModuleId('os.capture.TimelineRecorder');

import AbstractRecorder from './abstractrecorder.js';
import * as capture from './capture.js';
import CaptureEventType from './captureeventtype.js';

const Promise = goog.require('goog.Promise');
const GoogEventType = goog.require('goog.events.EventType');
const log = goog.require('goog.log');
const TimelineController = goog.require('os.time.TimelineController');

const {CanvasFn, RenderFn} = goog.requireType('os.capture');
const {default: IVideoEncoder} = goog.requireType('os.capture.IVideoEncoder');


/**
 * Records each frame of the timeline controller animation loop from a canvas.
 */
export default class TimelineRecorder extends AbstractRecorder {
  /**
   * Constructor.
   * @param {CanvasFn=} opt_canvasFn Function to get the canvas
   * @param {RenderFn=} opt_renderFn Callback to render the canvas
   */
  constructor(opt_canvasFn, opt_renderFn) {
    super();
    this.log = logger;
    this.title = 'Record Timeline';

    /**
     * The function to get the canvas element
     * @type {?CanvasFn}
     * @private
     */
    this.canvasFn_ = opt_canvasFn || capture.getDefaultCanvas;

    /**
     * Function to render the canvas
     * @type {?RenderFn}
     * @private
     */
    this.renderFn_ = opt_renderFn || null;

    /**
     * The timeline controller to use for the recording loop
     * @type {!TimelineController}
     * @private
     */
    this.tlc_ = TimelineController.getInstance();

    /**
     * Promise for the current recording step.
     * @type {Promise}
     * @private
     */
    this.promise_ = null;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.canvasFn_ = null;
    this.renderFn_ = null;
  }

  /**
   * @inheritDoc
   */
  cleanup() {
    super.cleanup();

    if (this.promise_) {
      this.promise_.cancel();
      this.promise_ = null;
    }
  }

  /**
   * @inheritDoc
   */
  abort(opt_msg) {
    var hasAborted = this.aborted;
    super.abort(opt_msg);

    if (!hasAborted) {
      if (this.promise_) {
        this.promise_.cancel();
        this.promise_ = null;
      }
    }
  }

  /**
   * @inheritDoc
   */
  record() {
    this.canvasFn_().then((canvas) => {
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
  }

  /**
   * Render the next frame to record.
   *
   * @return {!Promise}
   * @private
   */
  renderFrame_() {
    return this.renderFn_ ? this.renderFn_() : Promise.resolve();
  }

  /**
   * Handle the next frame in the recording.
   *
   * @private
   */
  processNextFrame_() {
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
      this.promise_ = this.renderFrame_().then(() => {
        this.setStatus('Generating image frame...');

        this.canvasFn_().then((canvas) => {
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
  }

  /**
   * Handle rejected promise while generating a canvas frame.
   *
   * @param {*} e
   * @private
   */
  onCaptureError_(e) {
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
  }

  /**
   * Process the generated canvas frames.
   *
   * @private
   */
  process_() {
    if (this.encoder) {
      this.encoder.listen(CaptureEventType.PROGRESS, this.onExportProgress_, false, this);
      this.encoder.listen(CaptureEventType.STATUS, this.onExportStatus_, false, this);
      this.encoder.listenOnce(CaptureEventType.COMPLETE, this.onExportComplete_, false, this);
      this.encoder.listenOnce(CaptureEventType.ERROR, this.onExportError_, false, this);

      if (this.vsm) { // stop listening for resize
        this.vsm.unlisten(GoogEventType.RESIZE, this.onViewportResize, false, this);
      }
      this.dispatchEvent(CaptureEventType.UNBLOCK);
      this.encoder.init(this.tlc_.getFps());
      this.encoder.setFrames(this.frames);
      this.encoder.process();
    } else {
      this.handleError('no video export format provided');
    }
  }

  /**
   * Handle video exporter progress event.
   *
   * @param {goog.events.Event} event
   * @private
   */
  onExportProgress_(event) {
    var exporter = /** @type {IVideoEncoder} */ (event.target);
    if (exporter) {
      this.setProgress(exporter.progress);
    }
  }

  /**
   * Handle video exporter status event.
   *
   * @param {goog.events.Event} event
   * @private
   */
  onExportStatus_(event) {
    var exporter = /** @type {IVideoEncoder} */ (event.target);
    if (exporter) {
      this.setStatus(exporter.status);
    }
  }

  /**
   * Handle video exporter complete.
   *
   * @param {goog.events.Event} event
   * @private
   */
  onExportComplete_(event) {
    var exporter = /** @type {IVideoEncoder} */ (event.target);
    if (exporter) {
      this.data = exporter.output;
      this.setStatus('Done!');
      this.dispatchEvent(CaptureEventType.COMPLETE);
    }
  }

  /**
   * Handle video exporter error.
   *
   * @param {goog.events.Event} event
   * @private
   */
  onExportError_(event) {
    var exporter = /** @type {IVideoEncoder} */ (event.target);
    if (exporter && exporter.errorMsg) {
      this.handleError(exporter.errorMsg);
    } else {
      // hopefully we don't get here... haven't encountered it yet
      this.handleError('Unable to create recording: video export failed unexpectedly.');
    }
  }
}

/**
 * Logger
 * @type {log.Logger}
 */
const logger = log.getLogger('os.capture.TimelineRecorder');
