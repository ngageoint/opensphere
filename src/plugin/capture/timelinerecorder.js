goog.provide('plugin.capture.TimelineRecorder');

goog.require('goog.log');
goog.require('os.capture.TimelineRecorder');



/**
 * Records each frame of the timeline controller animation loop from a canvas.
 *
 * @param {os.capture.CanvasFn=} opt_canvasFn Function to get the canvas
 * @param {os.capture.RenderFn=} opt_renderFn Callback to render the canvas
 *
 * @extends {os.capture.TimelineRecorder}
 * @constructor
 */
plugin.capture.TimelineRecorder = function(opt_canvasFn, opt_renderFn) {
  plugin.capture.TimelineRecorder.base(this, 'constructor', opt_canvasFn, opt_renderFn);
  this.log = plugin.capture.TimelineRecorder.LOGGER_;

  /**
   * If the data manager was time filtered prior to recording.
   * @type {boolean|undefined}
   * @private
   */
  this.wasTimeFiltered_ = undefined;
};
goog.inherits(plugin.capture.TimelineRecorder, os.capture.TimelineRecorder);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.capture.TimelineRecorder.LOGGER_ = goog.log.getLogger('plugin.capture.TimelineRecorder');


/**
 * @inheritDoc
 */
plugin.capture.TimelineRecorder.prototype.init = function() {
  plugin.capture.TimelineRecorder.base(this, 'init');

  var mdm = os.dataManager;
  this.wasTimeFiltered_ = mdm.getTimeFilterEnabled();

  // disable time filtering so the legend shows data for all time
  mdm.setTimeFilterEnabled(false);

  // listen for external changes to the time filter flag
  mdm.listen(goog.events.EventType.PROPERTYCHANGE, this.onDataManagerChange_, false, this);
};


/**
 * @inheritDoc
 */
plugin.capture.TimelineRecorder.prototype.cleanup = function() {
  plugin.capture.TimelineRecorder.base(this, 'cleanup');

  var mdm = os.dataManager;

  // remove the listener
  mdm.unlisten(goog.events.EventType.PROPERTYCHANGE, this.onDataManagerChange_, false, this);

  // set the value back to what it was
  if (this.wasTimeFiltered_ != undefined) {
    mdm.setTimeFilterEnabled(this.wasTimeFiltered_);
    this.wasTimeFiltered_ = undefined;
  }
};


/**
 * @param {os.events.PropertyChangeEvent} event The change event
 * @private
 */
plugin.capture.TimelineRecorder.prototype.onDataManagerChange_ = function(event) {
  if (!this.aborted) {
    var p = event.getProperty();
    if (p === os.data.PropertyChange.TIME_FILTER_ENABLED) {
      // clear the value so cleanup doesn't try changing it
      this.wasTimeFiltered_ = undefined;

      this.handleError('The application time filter has been changed externally, which may cause unexpected behavior ' +
          'in the recording. Recording has been aborted.');
    }
  }
};
