goog.module('os.ui.capture.AbstractCapturePlugin');

const Promise = goog.require('goog.Promise');
const googArray = goog.require('goog.array');
const log = goog.require('goog.log');
const userAgent = goog.require('goog.userAgent');
const dispatcher = goog.require('os.Dispatcher');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');
const capture = goog.require('os.capture');
const TimelineRecorder = goog.require('os.capture.TimelineRecorder');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const TimelineEventType = goog.require('os.time.TimelineEventType');
const {launchRecordingUI} = goog.require('os.ui.capture.RecordingUI');

const AbstractRecorder = goog.requireType('os.capture.AbstractRecorder');
const ElementRenderer = goog.requireType('os.ui.capture.ElementRenderer');


/**
 * Abstract plugin to manage screen capture.
 */
class AbstractCapturePlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = capture.ID;

    /**
     * The logger.
     * @type {log.Logger}
     * @protected
     */
    this.log = logger;

    /**
     * Track if we've tested browser support yet.
     * @type {boolean}
     * @private
     */
    this.checkedSupport_ = false;

    /**
     * Renderers that are static for each frame.
     * @type {!Array<!ElementRenderer>}
     * @protected
     */
    this.staticRenderers = this.initRenderers();

    /**
     * The current set of renderers for the frame.
     * @type {!Array<!ElementRenderer>}
     * @protected
     */
    this.renderers = [];
  }

  /**
   * @inheritDoc
   */
  init() {
    dispatcher.getInstance().listen(TimelineEventType.CAPTURE, this.capture_, false, this);
    dispatcher.getInstance().listen(TimelineEventType.RECORD, this.record_, false, this);
  }

  /**
   * Initialize the renderers that will be used to compose each frame.
   *
   * @return {!Array<!ElementRenderer>}
   * @protected
   */
  initRenderers() {
    return [];
  }

  /**
   * Add a renderer to the plugin.
   *
   * @param {!ElementRenderer} renderer The renderer.
   */
  addRenderer(renderer) {
    this.staticRenderers.push(renderer);
    this.staticRenderers.sort(rendererPrioritySort);
  }

  /**
   * Get dynamic renderers for the current frame.
   *
   * @return {!Array<!ElementRenderer>}
   * @protected
   */
  getDynamicRenderers() {
    return [];
  }

  /**
   * Update renderers that change by frame.
   *
   * @private
   */
  updateRenderers_() {
    this.renderers = this.staticRenderers.concat(this.getDynamicRenderers()).sort(rendererPrioritySort);
  }

  /**
   * Check browser support and alert the user if necessary. This should only happen the first time the user tries to
   * capture something.
   *
   * @private
   */
  checkSupport_() {
    if (!this.checkedSupport_) {
      this.checkedSupport_ = true;

      if (userAgent.IE) {
        // WebGL capture does not work at all in IE
        // the save-svg-as-png library does not work in IE
        // GIT creation is slow to unusable in IE
        var msg = 'Screen capture may not work as expected in Internet Explorer due to browser limitations. To use ' +
            'this feature, we recommend switching to Chrome or Firefox.';
        AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.WARNING,
            logger);
      }
    }
  }

  /**
   * Takes and saves a PNG screenshot of the canvas.
   *
   * @private
   */
  capture_() {
    this.checkSupport_();

    this.renderFrame().then(() => {
      this.getCanvas().then((canvas) => {
        if (canvas) {
          capture.saveCanvas(canvas);
        }
      }, this.onCaptureError, this);
    }, this.onCaptureError, this);
  }

  /**
   * Handle rejected promise in processNextFrame_.
   *
   * @param {*} e
   * @protected
   */
  onCaptureError(e) {
    var errorMsg = 'Failed to take screenshot:';
    var error;
    if (e instanceof Error) {
      error = e;
    } else if (typeof e == 'string') {
      errorMsg += ' ' + e;
    }

    log.error(this.log, errorMsg, error);
    AlertManager.getInstance().sendAlert('Unable to take screenshot. Please see the log for more details.',
        AlertEventSeverity.ERROR);
  }

  /**
   * Create a new instance of the recorder class to use.
   *
   * @return {!AbstractRecorder}
   * @protected
   */
  getRecorder() {
    return new TimelineRecorder(this.getCanvas.bind(this), this.renderFrame.bind(this, true));
  }

  /**
   * Launches the recording UI to create a timeline recording.
   *
   * @private
   */
  record_() {
    this.checkSupport_();

    var recorder = this.getRecorder();
    launchRecordingUI(recorder);
  }

  /**
   * Get the canvas to use for capture.
   *
   * @return {!Promise<HTMLCanvasElement>}
   * @protected
   */
  getCanvas() {
    return new Promise((resolve, reject) => {
      this.updateRenderers_();

      var canvas = null;

      var height = 0;
      var width = 0;
      for (var i = 0; i < this.renderers.length; i++) {
        height += this.renderers[i].getHeight();
        width += this.renderers[i].getWidth();
      }

      if (height > 0 && width > 0) {
        canvas = /** @type {!HTMLCanvasElement} */ (document.createElement('canvas'));
        canvas.width = width;
        canvas.height = height;

        this.drawNext(resolve, reject, canvas, 0);
      } else {
        reject('nothing to capture');
      }
    });
  }

  /**
   * Draw the next item to the canvas.
   *
   * @param {function(!HTMLCanvasElement)} resolve The resolution function to call when drawing is complete
   * @param {function(*)} reject The rejection function to call if drawing fails
   * @param {!HTMLCanvasElement} canvas The canvas to draw to
   * @param {number} next The next renderer index
   * @protected
   */
  drawNext(resolve, reject, canvas, next) {
    var renderer = this.renderers[next];
    if (renderer) {
      renderer.drawToCanvas(canvas).then(() => {
        this.drawNext(resolve, reject, canvas, ++next);
      }, (msg) => {
        reject('failed capturing ' + renderer.title + ': ' + msg);
      });
    } else {
      resolve(canvas);
    }
  }

  /**
   * Render the next canvas frame, resolving the returned promise when rendering completes.
   *
   * @param {boolean=} opt_waitForLoad - optionally wait for a load function to finish before rendering
   * @return {!Promise}
   * @protected
   */
  renderFrame(opt_waitForLoad) {
    return Promise.resolve();
  }
}

/**
 * Logger
 * @type {log.Logger}
 */
const logger = log.getLogger('os.ui.capture.AbstractCapturePlugin');

/**
 * Sort renderers by priority.
 *
 * @param {!ElementRenderer} a First renderer.
 * @param {!ElementRenderer} b Second renderer.
 * @return {number} The sort order.
 */
const rendererPrioritySort = function(a, b) {
  return googArray.inverseDefaultCompare(a.priority, b.priority);
};

exports = AbstractCapturePlugin;
