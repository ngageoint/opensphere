goog.module('plugin.capture.CapturePlugin');
goog.module.declareLegacyNamespace();

const Promise = goog.require('goog.Promise');
const Timer = goog.require('goog.Timer');
const log = goog.require('goog.log');
const userAgent = goog.require('goog.userAgent');
const MapContainer = goog.require('os.MapContainer');
const {getMapPixelRatio, setPixelRatioFn} = goog.require('os.capture');
const keys = goog.require('os.metrics.keys');
const TimelineEventType = goog.require('os.time.TimelineEventType');
const AbstractCapturePlugin = goog.require('os.ui.capture.AbstractCapturePlugin');
const TimelineRenderer = goog.require('os.ui.capture.TimelineRenderer');
const saveMenu = goog.require('os.ui.menu.save');
const {WAIT_TIME, onReady, recordSupported} = goog.require('plugin.capture');
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

    var menu = saveMenu.getMenu();
    if (menu) {
      var root = menu.getRoot();
      root.addChild({
        label: 'Screenshot',
        eventType: TimelineEventType.CAPTURE,
        tooltip: 'Save a screenshot',
        icons: ['<i class="fa fa-fw fa-camera"></i>'],
        metricKey: keys.Map.SCREEN_CAPTURE,
        sort: 20
      });

      root.addChild({
        label: 'Recording',
        eventType: TimelineEventType.RECORD,
        tooltip: 'Save an animated GIF recording',
        icons: ['<i class="fa fa-fw fa-circle"></i>'],
        metricKey: keys.Map.SCREEN_RECORD,
        beforeRender: recordingBeforeRender,
        sort: 21
      });
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

    if (!userAgent.IE) {
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
        Timer.callOnce(function() {
          onReady(resolve);
        }, WAIT_TIME);
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
 * @deprecated Please use plugin.capture.WAIT_TIME instead.
 */
CapturePlugin.WAIT_TIME = WAIT_TIME;


/**
 * Runs before the Recording menu item is rendered to update visibility.
 * @this {MenuItem}
 */
const recordingBeforeRender = function() {
  this.visible = recordSupported();
};

exports = CapturePlugin;
