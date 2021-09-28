goog.declareModuleId('os.capture.AbstractRecorder');

import CaptureEventType from './captureeventtype.js';

const dispose = goog.require('goog.dispose');
const ViewportSizeMonitor = goog.require('goog.dom.ViewportSizeMonitor');
const EventTarget = goog.require('goog.events.EventTarget');
const GoogEventType = goog.require('goog.events.EventType');
const log = goog.require('goog.log');

const {default: IRecorder} = goog.requireType('os.capture.IRecorder');
const {default: IVideoEncoder} = goog.requireType('os.capture.IVideoEncoder');


/**
 * Abstract class for creating a recording.
 *
 * @abstract
 * @implements {IRecorder}
 */
export default class AbstractRecorder extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * If the recording was aborted.
     * @type {boolean}
     */
    this.aborted = false;

    /**
     * Final recording data.
     * @type {*}
     */
    this.data = null;

    /**
     * Detailed error message if the recording fails.
     * @type {string}
     */
    this.errorMsg = '';

    /**
     * Progress percentage for the current task.
     * @type {number}
     */
    this.progress = 0;

    /**
     * Recorder status message.
     * @type {string}
     */
    this.status = '';

    /**
     * User-facing title of the recorder.
     * @type {string}
     */
    this.title = 'Give me a title please';

    /**
     * The video encoder.
     * @type {IVideoEncoder}
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
     * @type {log.Logger}
     * @protected
     */
    this.log = logger;

    /**
     * Monitor viewport size to abort recording if it changes.
     * @type {ViewportSizeMonitor}
     * @protected
     */
    this.vsm = new ViewportSizeMonitor();
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    dispose(this.encoder);
    this.encoder = null;

    dispose(this.vsm);
    this.vsm = null;

    this.cleanup();
  }

  /**
   * @inheritDoc
   */
  cleanup() {
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
      this.vsm.unlisten(GoogEventType.RESIZE, this.onViewportResize, false, this);
    }
  }

  /**
   * @inheritDoc
   */
  init() {
    // we need to abort if the browser is resized, or the GIF will be pretty much useless
    if (this.vsm) {
      this.vsm.listenOnce(GoogEventType.RESIZE, this.onViewportResize, false, this);
    }
  }

  /**
   * Abort the recording.
   * @param {string=} opt_msg Abort message
   * @override
   */
  abort(opt_msg) {
    if (!this.aborted) {
      this.aborted = true;

      if (this.encoder) {
        this.encoder.abort();
      }

      var msg = opt_msg || 'Recording aborted by user.';
      log.error(this.log, msg);
    }
  }

  /**
   * @abstract
   * @inheritDoc
   */
  record() {}

  /**
   * @inheritDoc
   */
  setEncoder(value) {
    this.encoder = value;
  }

  /**
   * Set the error message and dispatch the error event.
   *
   * @param {string} msg The error message
   * @param {Error=} opt_error The caught error
   * @protected
   */
  handleError(msg, opt_error) {
    if (opt_error) {
      log.error(this.log, this.errorMsg, opt_error);
    }

    this.errorMsg = 'Encountered an error while recording: ' + msg;
    this.abort(this.errorMsg);

    this.dispatchEvent(CaptureEventType.ERROR);
  }

  /**
   * Set the progress for the recorder and fire an event.
   *
   * @param {number} value The new progress value.
   * @protected
   */
  setProgress(value) {
    this.progress = value;
    this.dispatchEvent(CaptureEventType.PROGRESS);
  }

  /**
   * Set the status for the recorder and fire an event.
   *
   * @param {string} value The new status value.
   * @protected
   */
  setStatus(value) {
    this.status = value;
    this.dispatchEvent(CaptureEventType.STATUS);
  }

  /**
   * Handle viewport resize.
   *
   * @param {goog.events.Event} event
   * @protected
   */
  onViewportResize(event) {
    if (!this.aborted) {
      var errorMsg = 'Resizing the browser would result in a distorted recording.';
      this.abort(errorMsg);
      this.handleError(errorMsg);
    }
  }
}

/**
 * Logger
 * @type {log.Logger}
 */
const logger = log.getLogger('os.capture.AbstractRecorder');
