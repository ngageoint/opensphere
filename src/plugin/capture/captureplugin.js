goog.provide('plugin.capture.CapturePlugin');

goog.require('goog.Promise');
goog.require('goog.log');
goog.require('ol.MapEvent');
goog.require('ol.events');
goog.require('os.MapContainer');
goog.require('os.metrics.keys');
goog.require('os.ui.capture.AbstractCapturePlugin');
goog.require('os.ui.capture.TimelineRenderer');
goog.require('os.ui.menu.save');
goog.require('plugin.capture.LegendRenderer');
goog.require('plugin.capture.MapOverlayRenderer');
goog.require('plugin.capture.MapRenderer');
goog.require('plugin.capture.TimelineRecorder');



/**
 * Plugin to manage screen capture for opensphere
 * @extends {os.ui.capture.AbstractCapturePlugin}
 * @constructor
 */
plugin.capture.CapturePlugin = function() {
  plugin.capture.CapturePlugin.base(this, 'constructor');
  this.log = plugin.capture.CapturePlugin.LOGGER_;
};
goog.inherits(plugin.capture.CapturePlugin, os.ui.capture.AbstractCapturePlugin);
goog.addSingletonGetter(plugin.capture.CapturePlugin);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.capture.CapturePlugin.LOGGER_ = goog.log.getLogger('plugin.capture.CapturePlugin');


/**
 * wait time in milliseconds
 * @type {number}
 */
plugin.capture.CapturePlugin.WAIT_TIME = 100;


/**
 * @inheritDoc
 */
plugin.capture.CapturePlugin.prototype.init = function() {
  plugin.capture.CapturePlugin.base(this, 'init');

  var menu = os.ui.menu.SAVE;
  if (menu) {
    var root = menu.getRoot();
    root.addChild({
      label: 'Screenshot',
      eventType: os.time.TimelineEventType.CAPTURE,
      tooltip: 'Save a screenshot',
      icons: ['<i class="fa fa-fw fa-camera"></i>'],
      metricKey: os.metrics.keys.Map.SCREEN_CAPTURE,
      sort: 20
    });

    var child = root.addChild({
      label: 'Recording',
      eventType: os.time.TimelineEventType.RECORD,
      tooltip: 'Save an animated GIF recording',
      icons: ['<i class="fa fa-fw fa-circle red-icon"></i>'],
      metricKey: os.metrics.keys.Map.SCREEN_RECORD,
      sort: 21
    });
    child.beforeRender = plugin.capture.recordingBeforeRender_;
  }
};


/**
 * Runs before the Recording menu item is rendered to update visibility.
 * @this {os.ui.menu.MenuItem}
 * @private
 */
plugin.capture.recordingBeforeRender_ = function() {
  this.visible = plugin.capture.recordSupported();
};


/**
 * @return {boolean}
 */
plugin.capture.recordSupported = function() {
  var tlc = os.time.TimelineController.getInstance();
  // record is supported when the window is not the same as the loop
  var winRight = tlc.getCurrent();
  var winLeft = winRight - tlc.getOffset();
  var loopStart = tlc.getLoopStart();
  var loopEnd = tlc.getLoopEnd();

  return winLeft != loopStart || winRight != loopEnd;
};


/**
 * @inheritDoc
 */
plugin.capture.CapturePlugin.prototype.initRenderers = function() {
  var renderers = [
    new plugin.capture.MapRenderer(),
    new plugin.capture.MapOverlayRenderer(),
    new plugin.capture.LegendRenderer()
  ];

  if (!goog.userAgent.IE) {
    renderers.push(new os.ui.capture.TimelineRenderer({
      'fill': '#888'
    }));
  }

  return renderers;
};


/**
 * @inheritDoc
 */
plugin.capture.CapturePlugin.prototype.getRecorder = function() {
  return new plugin.capture.TimelineRecorder(this.getCanvas.bind(this), this.renderFrame.bind(this, true));
};


/**
 * @inheritDoc
 */
plugin.capture.CapturePlugin.prototype.renderFrame = function(opt_waitForLoad) {
  return new goog.Promise(function(resolve, reject) {
    var waitForLoad = opt_waitForLoad || false;
    if (waitForLoad) {
      goog.Timer.callOnce(function() {
        plugin.capture.onReady_(resolve);
      }, plugin.capture.CapturePlugin.WAIT_TIME);
    } else {
      resolve();
    }
  }, this);
};


/**
 * Check if the application is ready to capture the screen.
 * @param {Function} callback The function to call when ready to capture
 * @private
 */
plugin.capture.onReady_ = function(callback) {
  // Check if we are ready to take picture
  var ready = goog.array.every(os.MapContainer.getInstance().getLayers(), function(layer) {
    layer = /** @type {os.layer.ILayer} */ (layer);
    return !layer.isLoading();
  });

  if (ready) {
    // once layers have finished loading, wait another second for histograms, color models, etc to update
    goog.Timer.callOnce(callback, 1000);
  } else {
    // not ready, wait 100ms and try again
    goog.Timer.callOnce(function() {
      plugin.capture.onReady_(callback);
    }, plugin.capture.CapturePlugin.WAIT_TIME);
  }
};
