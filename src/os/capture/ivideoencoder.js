goog.declareModuleId('os.capture.IVideoEncoder');

const Listenable = goog.requireType('goog.events.Listenable');


/**
 * Interface for saving video frames to a file.
 *
 * @interface
 * @extends {Listenable}
 */
export default class IVideoEncoder {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * User-facing description of the video encoder.
     * @type {string}
     */
    this.description;

    /**
     * Detailed error message if encoding fails.
     * @type {string}
     */
    this.errorMsg;

    /**
     * The file extension for encoded videos.
     * @type {string}
     */
    this.extension;

    /**
     * Final video output.
     * @type {*}
     */
    this.output;

    /**
     * Progress percentage for the current task.
     * @type {number}
     */
    this.progress;

    /**
     * Encoder status message.
     * @type {string}
     */
    this.status;

    /**
     * User-facing title of the video encoder.
     * @type {string}
     */
    this.title;
  }

  /**
   * Abort the encoding process.
   */
  abort() {}

  /**
   * Clean up any resources that shouldn't reside in memory.
   */
  cleanup() {}

  /**
   * Initialize the encoder.
   * @param {number} frameRate The frame rate of the video
   * @param {number=} opt_quality The video quality, from 0 to 1
   */
  init(frameRate, opt_quality) {}

  /**
   * Process video frames.
   */
  process() {}

  /**
   * Set the source frames to use in the video.
   * @param {!Array<!HTMLCanvasElement>} frames The video frames
   */
  setFrames(frames) {}
}
