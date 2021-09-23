goog.declareModuleId('os.capture.AbstractVideoEncoder');

import CaptureEventType from './captureeventtype.js';

const EventTarget = goog.require('goog.events.EventTarget');
const TrustedResourceUrl = goog.require('goog.html.TrustedResourceUrl');
const log = goog.require('goog.log');
const jsloader = goog.require('goog.net.jsloader');
const osString = goog.require('os.string');

const {default: IVideoEncoder} = goog.requireType('os.capture.IVideoEncoder');


/**
 * Abstract class for exporting a video.
 *
 * @abstract
 * @implements {IVideoEncoder}
 */
export default class AbstractVideoEncoder extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * User-facing description of the video encoder.
     * @type {string}
     */
    this.description = '';

    /**
     * The file extension for encoded videos.
     * @type {string}
     */
    this.extension = 'unknown';

    /**
     * Detailed error message if encoding fails.
     * @type {string}
     */
    this.errorMsg = '';

    /**
     * Final video output.
     * @type {*}
     */
    this.output = null;

    /**
     * Progress percentage for the current task.
     * @type {number}
     */
    this.progress = 0;

    /**
     * Encoder status message.
     * @type {string}
     */
    this.status = '';

    /**
     * User-facing title of the video encoder.
     * @type {string}
     */
    this.title = 'Give me a title!';

    /**
     * The original canvas frames.
     * @type {!Array<!HTMLCanvasElement>}
     * @protected
     */
    this.frames = [];

    /**
     * The video frame rate.
     * @type {number}
     */
    this.frameRate = 0;

    /**
     * The video quality.
     * @type {number}
     */
    this.quality = AbstractVideoEncoder.DEFAULT_QUALITY;

    /**
     * The logger for the exporter.
     * @type {log.Logger}
     * @protected
     */
    this.log = logger;

    /**
     * The encoder script URL, if it should be lazy loaded.
     * @type {string|undefined}
     * @protected
     */
    this.scriptUrl = undefined;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    this.cleanup();
  }

  /**
   * @inheritDoc
   */
  abort() {}

  /**
   * @inheritDoc
   */
  cleanup() {
    this.frames.length = 0;
    this.output = null;
  }

  /**
   * Initialize the encoder.
   * @param {number} frameRate The frame rate of the video
   * @param {number=} opt_quality The video quality, from 0 to 1
   * @override
   */
  init(frameRate, opt_quality) {
    this.cleanup();

    this.frameRate = frameRate;
    this.quality = opt_quality || AbstractVideoEncoder.DEFAULT_QUALITY;
  }

  /**
   * @inheritDoc
   */
  process() {
    if (!this.isEncoderLoaded()) {
      if (this.scriptUrl) {
        var trustedUrl = TrustedResourceUrl.fromConstant(osString.createConstant(this.scriptUrl));
        jsloader.safeLoad(trustedUrl).addCallbacks(this.processInternal, this.onScriptLoadError, this);
      } else {
        this.handleError(this.title + ' encoder is not available');
      }
    } else {
      this.processInternal();
    }
  }

  /**
   * Process the video frames once the encoder has been loaded.
   *
   * @abstract
   * @protected
   */
  processInternal() {}

  /**
   * If the encoder library has been loaded in the browser.
   *
   * @return {boolean}
   * @protected
   */
  isEncoderLoaded() {
    // by default, assume the library is loaded in the index.html
    return true;
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

    this.errorMsg = 'Encountered an error while exporting video: ' + msg;

    this.dispatchEvent(CaptureEventType.ERROR);
  }

  /**
   * Handle failure to load the encoder library.
   *
   * @param {jsloader.Error} error The error
   * @protected
   */
  onScriptLoadError(error) {
    this.scriptUrl = undefined;
    this.handleError(error ? error.message : 'failed to load the ' + this.title + ' encoder');
  }

  /**
   * @inheritDoc
   */
  setFrames(frames) {
    this.frames = frames;
  }

  /**
   * Set the progress for the export process and fire an event.
   *
   * @param {number} value The new progress value.
   * @protected
   */
  setProgress(value) {
    this.progress = value;
    this.dispatchEvent(CaptureEventType.PROGRESS);
  }

  /**
   * Set the status for the export process and fire an event.
   *
   * @param {string} value The new status value.
   * @protected
   */
  setStatus(value) {
    this.status = value;
    this.dispatchEvent(CaptureEventType.STATUS);
  }
}

/**
 * Logger
 * @type {log.Logger}
 */
const logger = log.getLogger('os.capture.AbstractVideoEncoder');

/**
 * The default video quality.
 * @type {number}
 * @const
 */
AbstractVideoEncoder.DEFAULT_QUALITY = 1.0;
