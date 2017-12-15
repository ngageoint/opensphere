goog.provide('os.interaction.Reset');
goog.require('ol.MapBrowserEvent');
goog.require('ol.events.EventType');
goog.require('ol.events.condition');
goog.require('ol.interaction.Interaction');
goog.require('os.I3DSupport');
goog.require('os.MapContainer');
goog.require('os.metrics.Metrics');
goog.require('os.metrics.keys');



/**
 * Overridden to use smaller zoom increments
 * @constructor
 * @implements {os.I3DSupport}
 * @extends {ol.interaction.Interaction}
 * @param {olx.interaction.MouseWheelZoomOptions=} opt_options Options.
 */
os.interaction.Reset = function(opt_options) {
  os.interaction.Reset.base(this, 'constructor', {
    handleEvent: os.interaction.Reset.handleEvent
  });

  this.condition_ = goog.functions.and(ol.events.condition.noModifierKeys, ol.events.condition.targetNotEditable);
};
goog.inherits(os.interaction.Reset, ol.interaction.Interaction);


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} `false` to stop event propagation.
 * @this os.interaction.Reset
 * @suppress {duplicate}
 */
os.interaction.Reset.handleEvent = function(mapBrowserEvent) {
  var stopEvent = false;
  if (mapBrowserEvent.type == ol.events.EventType.KEYDOWN && this.condition_(mapBrowserEvent)) {
    var keyCode = mapBrowserEvent.originalEvent.keyCode;
    stopEvent = true;

    switch (keyCode) {
      case goog.events.KeyCodes.V:
        os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.RESET_VIEW_KB, 1);
        os.MapContainer.getInstance().resetView();
        break;
      case goog.events.KeyCodes.N:
        os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.RESET_ROLL_KB, 1);
        os.MapContainer.getInstance().resetRoll();
        break;
      case goog.events.KeyCodes.U:
        os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.RESET_TILT_KB, 1);
        os.MapContainer.getInstance().resetTilt();
        break;
      case goog.events.KeyCodes.R:
        os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.RESET_ROTATION_KB, 1);
        os.MapContainer.getInstance().resetRotation();
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


/**
 * @inheritDoc
 */
os.interaction.Reset.prototype.is3DSupported = function() {
  return true;
};
