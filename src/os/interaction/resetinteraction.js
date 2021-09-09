goog.module('os.interaction.Reset');

const KeyCodes = goog.require('goog.events.KeyCodes');
const {and} = goog.require('goog.functions');
const EventType = goog.require('ol.events.EventType');
const {noModifierKeys, targetNotEditable} = goog.require('ol.events.condition');
const Interaction = goog.require('ol.interaction.Interaction');
const I3DSupport = goog.require('os.I3DSupport');
const osImplements = goog.require('os.implements');
const {getMapContainer} = goog.require('os.map.instance');
const Metrics = goog.require('os.metrics.Metrics');
const {Map: MapMetrics} = goog.require('os.metrics.keys');

const MapBrowserEvent = goog.requireType('ol.MapBrowserEvent');


/**
 * Overridden to use smaller zoom increments
 *
 * @implements {I3DSupport}
 */
class Reset extends Interaction {
  /**
   * Constructor.
   * @param {olx.interaction.MouseWheelZoomOptions=} opt_options Options.
   */
  constructor(opt_options) {
    super({
      handleEvent: Reset.handleEvent
    });

    this.condition_ = and(noModifierKeys, targetNotEditable);
  }

  /**
   * @inheritDoc
   */
  is3DSupported() {
    return true;
  }

  /**
   * @param {MapBrowserEvent} mapBrowserEvent Map browser event.
   * @return {boolean} `false` to stop event propagation.
   * @this Reset
   * @suppress {duplicate}
   */
  static handleEvent(mapBrowserEvent) {
    var stopEvent = false;
    if (mapBrowserEvent.type == EventType.KEYDOWN && this.condition_(mapBrowserEvent)) {
      var keyCode = mapBrowserEvent.originalEvent.keyCode;
      stopEvent = true;

      switch (keyCode) {
        case KeyCodes.V:
          Metrics.getInstance().updateMetric(MapMetrics.RESET_VIEW_KB, 1);
          getMapContainer().resetView();
          break;
        case KeyCodes.R:
          Metrics.getInstance().updateMetric(MapMetrics.RESET_ROTATION_KB, 1);
          getMapContainer().resetRotation();
          break;
        case KeyCodes.N:
          Metrics.getInstance().updateMetric(MapMetrics.RESET_ROLL_KB, 1);
          getMapContainer().resetRoll();
          break;
        case KeyCodes.U:
          Metrics.getInstance().updateMetric(MapMetrics.RESET_TILT_KB, 1);
          getMapContainer().resetTilt();
          break;
        default:
          stopEvent = false;
          break;
      }
    }

    if (stopEvent) {
      mapBrowserEvent.preventDefault();
    }

    return !stopEvent;
  }
}

osImplements(Reset, I3DSupport.ID);

exports = Reset;
