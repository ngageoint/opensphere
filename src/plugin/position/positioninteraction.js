goog.declareModuleId('plugin.position.PositionInteraction');

import {launchCopy} from './copyposition.js';

const KeyCodes = goog.require('goog.events.KeyCodes');
const functions = goog.require('goog.functions');
const EventType = goog.require('ol.events.EventType');
const {noModifierKeys, targetNotEditable} = goog.require('ol.events.condition');
const Interaction = goog.require('ol.interaction.Interaction');
const I3DSupport = goog.require('os.I3DSupport');
const osImplements = goog.require('os.implements');
const Metrics = goog.require('os.metrics.Metrics');
const keys = goog.require('os.metrics.keys');

/**
 * Handles the behavior of clicking the PERIOD button or Copy Coordinates from the context menu.
 *
 * @implements {I3DSupport}
 */
export default class PositionInteraction extends Interaction {
  /**
   * Constructor.
   */
  constructor() {
    super({handleEvent});

    this.condition_ = functions.and(noModifierKeys, targetNotEditable);
  }

  /**
   * Whether or not this interaction is supported in 3D mode
   *
   * @return {boolean}
   * @override
   */
  is3DSupported() {
    return true;
  }
}

osImplements(PositionInteraction, I3DSupport.ID);


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} `false` to stop event propagation.
 * @this plugin.position.PositionInteraction
 */
const handleEvent = function(mapBrowserEvent) {
  var stopEvent = false;
  if (mapBrowserEvent.type == EventType.KEYDOWN && this.condition_(mapBrowserEvent)) {
    var keyCode = mapBrowserEvent.originalEvent.keyCode;
    stopEvent = true;

    switch (keyCode) {
      case KeyCodes.PERIOD:
        Metrics.getInstance().updateMetric(keys.Map.COPY_COORDINATES_KB, 1);
        launchCopy();
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
};
