goog.provide('os.ui.capture.AbstractCapturePlugin');

goog.require('goog.Promise');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('os.capture');
goog.require('os.capture.TimelineRecorder');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.time.TimelineEventType');
goog.require('os.ui.capture.recordingUIDirective');



/**
 * Abstract plugin to manage screen capture.
 *
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
os.ui.capture.AbstractCapturePlugin = function() {
  os.ui.capture.AbstractCapturePlugin.base(this, 'constructor');
  this.id = os.capture.ID;

  /**
   * The logger.
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.ui.capture.AbstractCapturePlugin.LOGGER_;

  /**
   * Track if we've tested browser support yet.
   * @type {boolean}
   * @private
   */
  this.checkedSupport_ = false;

  /**
   * Renderers that are static for each frame.
   * @type {!Array<!os.ui.capture.ElementRenderer>}
   * @protected
   */
  this.staticRenderers = this.initRenderers();

  /**
   * The current set of renderers for the frame.
   * @type {!Array<!os.ui.capture.ElementRenderer>}
   * @protected
   */
  this.renderers = [];
};
goog.inherits(os.ui.capture.AbstractCapturePlugin, os.plugin.AbstractPlugin);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.capture.AbstractCapturePlugin.LOGGER_ = goog.log.getLogger('os.ui.capture.AbstractCapturePlugin');


/**
 * @inheritDoc
 */
os.ui.capture.AbstractCapturePlugin.prototype.init = function() {
  os.dispatcher.listen(os.time.TimelineEventType.CAPTURE, this.capture_, false, this);
  os.dispatcher.listen(os.time.TimelineEventType.RECORD, this.record_, false, this);
};


/**
 * Initialize the renderers that will be used to compose each frame.
 *
 * @return {!Array<!os.ui.capture.ElementRenderer>}
 * @protected
 */
os.ui.capture.AbstractCapturePlugin.prototype.initRenderers = function() {
  return [];
};


/**
 * Add a renderer to the plugin.
 *
 * @param {!os.ui.capture.ElementRenderer} renderer The renderer.
 */
os.ui.capture.AbstractCapturePlugin.prototype.addRenderer = function(renderer) {
  this.staticRenderers.push(renderer);
  this.staticRenderers.sort(os.ui.capture.rendererPrioritySort);
};


/**
 * Get dynamic renderers for the current frame.
 *
 * @return {!Array<!os.ui.capture.ElementRenderer>}
 * @protected
 */
os.ui.capture.AbstractCapturePlugin.prototype.getDynamicRenderers = function() {
  return [];
};


/**
 * Update renderers that change by frame.
 *
 * @private
 */
os.ui.capture.AbstractCapturePlugin.prototype.updateRenderers_ = function() {
  this.renderers = this.staticRenderers.concat(this.getDynamicRenderers()).sort(os.ui.capture.rendererPrioritySort);
};


/**
 * Check browser support and alert the user if necessary. This should only happen the first time the user tries to
 * capture something.
 *
 * @private
 */
os.ui.capture.AbstractCapturePlugin.prototype.checkSupport_ = function() {
  if (!this.checkedSupport_) {
    this.checkedSupport_ = true;

    if (goog.userAgent.IE) {
      // WebGL capture does not work at all in IE
      // the save-svg-as-png library does not work in IE
      // GIT creation is slow to unusable in IE
      var msg = 'Screen capture may not work as expected in Internet Explorer due to browser limitations. To use ' +
          'this feature, we recommend switching to Chrome or Firefox.';
      os.alertManager.sendAlert(msg, os.alert.AlertEventSeverity.WARNING,
          os.ui.capture.AbstractCapturePlugin.LOGGER_);
    }
  }
};


/**
 * Takes and saves a PNG screenshot of the canvas.
 *
 * @private
 */
os.ui.capture.AbstractCapturePlugin.prototype.capture_ = function() {
  this.checkSupport_();

  this.renderFrame().then(function() {
    this.getCanvas().then(function(canvas) {
      if (canvas) {
        os.capture.saveCanvas(canvas);
      }
    }, this.onCaptureError, this);
  }, this.onCaptureError, this);
};


/**
 * Handle rejected promise in processNextFrame_.
 *
 * @param {*} e
 * @protected
 */
os.ui.capture.AbstractCapturePlugin.prototype.onCaptureError = function(e) {
  var errorMsg = 'Failed to take screenshot:';
  var error;
  if (e instanceof Error) {
    error = e;
  } else if (typeof e == 'string') {
    errorMsg += ' ' + e;
  }

  goog.log.error(this.log, errorMsg, error);
  os.alertManager.sendAlert('Unable to take screenshot. Please see the log for more details.',
      os.alert.AlertEventSeverity.ERROR);
};


/**
 * Create a new instance of the recorder class to use.
 *
 * @return {!os.capture.AbstractRecorder}
 * @protected
 */
os.ui.capture.AbstractCapturePlugin.prototype.getRecorder = function() {
  return new os.capture.TimelineRecorder(this.getCanvas.bind(this), this.renderFrame.bind(this, true));
};


/**
 * Launches the recording UI to create a timeline recording.
 *
 * @private
 */
os.ui.capture.AbstractCapturePlugin.prototype.record_ = function() {
  this.checkSupport_();

  var recorder = this.getRecorder();
  os.ui.capture.launchRecordingUI(recorder);
};


/**
 * Get the canvas to use for capture.
 *
 * @return {!goog.Promise<HTMLCanvasElement>}
 * @protected
 */
os.ui.capture.AbstractCapturePlugin.prototype.getCanvas = function() {
  return new goog.Promise(function(resolve, reject) {
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
  }, this);
};


/**
 * Draw the next item to the canvas.
 *
 * @param {function(!HTMLCanvasElement)} resolve The resolution function to call when drawing is complete
 * @param {function(*)} reject The rejection function to call if drawing fails
 * @param {!HTMLCanvasElement} canvas The canvas to draw to
 * @param {number} next The next renderer index
 * @protected
 */
os.ui.capture.AbstractCapturePlugin.prototype.drawNext = function(resolve, reject, canvas, next) {
  var renderer = this.renderers[next];
  if (renderer) {
    renderer.drawToCanvas(canvas).then(function() {
      this.drawNext(resolve, reject, canvas, ++next);
    }, function(msg) {
      reject('failed capturing ' + renderer.title + ': ' + msg);
    }, this);
  } else {
    resolve(canvas);
  }
};


/**
 * Render the next canvas frame, resolving the returned promise when rendering completes.
 *
 * @param {boolean=} opt_waitForLoad - optionally wait for a load function to finish before rendering
 * @return {!goog.Promise}
 * @protected
 */
os.ui.capture.AbstractCapturePlugin.prototype.renderFrame = function(opt_waitForLoad) {
  return goog.Promise.resolve();
};


/**
 * Sort renderers by priority.
 *
 * @param {!os.ui.capture.ElementRenderer} a First renderer.
 * @param {!os.ui.capture.ElementRenderer} b Second renderer.
 * @return {number} The sort order.
 */
os.ui.capture.rendererPrioritySort = function(a, b) {
  return goog.array.inverseDefaultCompare(a.priority, b.priority);
};
