goog.declareModuleId('os.capture.IRecorder');

const IDisposable = goog.requireType('goog.disposable.IDisposable');
const Listenable = goog.requireType('goog.events.Listenable');
const {default: IVideoEncoder} = goog.requireType('os.capture.IVideoEncoder');


/**
 * Interface for a class that produces a recording.
 *
 * @extends {IDisposable}
 * @extends {Listenable}
 * @interface
 */
export default class IRecorder {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * If the recording was aborted.
     * @type {boolean}
     */
    this.aborted;

    /**
     * Final recording data.
     * @type {*}
     */
    this.data;

    /**
     * Detailed error message if the recording fails.
     * @type {string}
     */
    this.errorMsg;

    /**
     * Progress percentage for the current task.
     * @type {number}
     */
    this.progress;

    /**
     * Recorder status message.
     * @type {string}
     */
    this.status;

    /**
     * User-facing title of the recorder.
     * @type {string}
     */
    this.title;
  }

  /**
   * Clean up any resources that shouldn't reside in memory.
   */
  cleanup() {}

  /**
   * Abort the recording.
   * @param {string=} opt_msg Abort message
   */
  abort(opt_msg) {}

  /**
   * Initialize the recorder.
   */
  init() {}

  /**
   * Create a recording.
   */
  record() {}

  /**
   * Set the encoder used to save recordings.
   * @param {!IVideoEncoder} value The encoder to use to save the recording.
   */
  setEncoder(value) {}
}
