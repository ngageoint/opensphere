goog.declareModuleId('os.interaction.Reset');

import {noModifierKeys, targetNotEditable} from 'ol/src/events/condition.js';
import EventType from 'ol/src/events/EventType.js';
import Interaction from 'ol/src/interaction/Interaction.js';

import I3DSupport from '../i3dsupport.js';
import osImplements from '../implements.js';
import {getMapContainer} from '../map/mapinstance.js';
import Metrics from '../metrics/metrics.js';
import {Map as MapMetrics} from '../metrics/metricskeys.js';

const KeyCodes = goog.require('goog.events.KeyCodes');
const {and} = goog.require('goog.functions');


/**
 * Overridden to use smaller zoom increments
 *
 * @implements {I3DSupport}
 */
export default class Reset extends Interaction {
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
