goog.module('plugin.capture.CapturePlugin');
goog.module.declareLegacyNamespace();

const Promise = goog.require('goog.Promise');
const log = goog.require('goog.log');
const MapContainer = goog.require('os.MapContainer');
const {getMapPixelRatio, setPixelRatioFn} = goog.require('os.capture');
const keys = goog.require('os.metrics.keys');
const AbstractCapturePlugin = goog.require('os.ui.capture.AbstractCapturePlugin');
const TimelineRenderer = goog.require('os.ui.capture.TimelineRenderer');
const saveMenu = goog.require('os.ui.menu.save');
const AnnotationTailRenderer = goog.require('plugin.capture.AnnotationTailRenderer');
const LegendRenderer = goog.require('plugin.capture.LegendRenderer');
const MapOverlayRenderer = goog.require('plugin.capture.MapOverlayRenderer');
const MapOverviewRenderer = goog.require('plugin.capture.MapOverviewRenderer');
const MapRenderer = goog.require('plugin.capture.MapRenderer');
const TimelineRecorder = goog.require('plugin.capture.TimelineRecorder');

const MenuItem = goog.requireType('os.ui.menu.MenuItem');


/**
 * Plugin to manage screen capture for opensphere
 */
class CapturePlugin extends AbstractCapturePlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.log = logger;
  }

  /**
   * @inheritDoc
   */
  init() {
    super.init();

    var menu = saveMenu.MENU;
    if (menu) {
      var root = menu.getRoot();
      root.addChild({
        label: 'Screenshot',
        eventType: os.time.TimelineEventType.CAPTURE,
        tooltip: 'Save a screenshot',
        icons: ['<i class="fa fa-fw fa-camera"></i>'],
        metricKey: keys.Map.SCREEN_CAPTURE,
        sort: 20
      });

      var child = root.addChild({
        label: 'Recording',
        eventType: os.time.TimelineEventType.RECORD,
        tooltip: 'Save an animated GIF recording',
        icons: ['<i class="fa fa-fw fa-circle"></i>'],
        metricKey: keys.Map.SCREEN_RECORD,
        sort: 21
      });
      child.beforeRender = recordingBeforeRender;
    }

    // replace the capture pixel ratio function to use the map pixel ratio
    setPixelRatioFn(getMapPixelRatio);
  }

  /**
   * @inheritDoc
   */
  initRenderers() {
    var renderers = [
      new MapRenderer(),
      new MapOverviewRenderer(),
      new LegendRenderer()
    ];

    if (!goog.userAgent.IE) {
      renderers.push(new TimelineRenderer());
    }

    return renderers;
  }

  /**
   * @inheritDoc
   */
  getDynamicRenderers() {
    var renderers = [];

    var map = MapContainer.getInstance().getMap();
    if (map) {
      var overlays = map.getOverlays().getArray();
      overlays.forEach(function(overlay) {
        var element = overlay.getElement();
        var position = overlay.getPosition();
        if (element && position) {
          if (element.querySelector('svg.c-annotation__svg')) {
            renderers.push(new AnnotationTailRenderer(overlay));
          }

          renderers.push(new MapOverlayRenderer(overlay));
        }
      });
    }

    return renderers;
  }

  /**
   * @inheritDoc
   */
  getRecorder() {
    return new TimelineRecorder(this.getCanvas.bind(this), this.renderFrame.bind(this, true));
  }

  /**
   * @inheritDoc
   */
  renderFrame(opt_waitForLoad) {
    return new Promise((resolve, reject) => {
      var waitForLoad = opt_waitForLoad || false;
      if (waitForLoad) {
        goog.Timer.callOnce(function() {
          onReady(resolve);
        }, CapturePlugin.WAIT_TIME);
      } else {
        resolve();
      }
    });
  }

  /**
   * Get the global instance.
   * @return {!CapturePlugin}
   */
  static getInstance() {
    if (!instance) {
      instance = new CapturePlugin();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {CapturePlugin} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {CapturePlugin|undefined}
 */
let instance;

/**
 * Logger
 * @type {log.Logger}
 */
const logger = log.getLogger('plugin.capture.CapturePlugin');


/**
 * wait time in milliseconds
 * @type {number}
 */
CapturePlugin.WAIT_TIME = 100;


/**
 * Runs before the Recording menu item is rendered to update visibility.
 * @this {MenuItem}
 */
const recordingBeforeRender = function() {
  this.visible = recordSupported();
};

/**
 * @return {boolean}
 */
const recordSupported = function() {
  var tlc = os.time.TimelineController.getInstance();
  // record is supported when the window is not the same as the loop
  var winRight = tlc.getCurrent();
  var winLeft = winRight - tlc.getOffset();
  var loopStart = tlc.getLoopStart();
  var loopEnd = tlc.getLoopEnd();

  return winLeft != loopStart || winRight != loopEnd;
};

/**
 * Check if the application is ready to capture the screen.
 *
 * @param {Function} callback The function to call when ready to capture
 */
const onReady = function(callback) {
  // Check if we are ready to take picture
  var ready = goog.array.every(MapContainer.getInstance().getLayers(), function(layer) {
    layer = /** @type {os.layer.ILayer} */ (layer);
    return !layer.isLoading();
  });

  if (ready) {
    // once layers have finished loading, wait another second for histograms, color models, etc to update
    goog.Timer.callOnce(callback, 1000);
  } else {
    // not ready, wait 100ms and try again
    goog.Timer.callOnce(function() {
      onReady(callback);
    }, CapturePlugin.WAIT_TIME);
  }
};

exports = CapturePlugin;
