goog.provide('plugin.position.PositionInteraction');

goog.require('ol.events.condition');
goog.require('ol.interaction.Interaction');
goog.require('os.I3DSupport');
goog.require('os.metrics.Metrics');
goog.require('os.metrics.keys');



/**
 * Handles the behavior of clicking the PERIOD button or Copy Coordinates from the context menu.
 * @constructor
 * @extends {ol.interaction.Interaction}
 * @implements {os.I3DSupport}
 */
plugin.position.PositionInteraction = function() {
  plugin.position.PositionInteraction.base(this, 'constructor', {
    handleEvent: plugin.position.PositionInteraction.handleEvent
  });

  this.condition_ = goog.functions.and(ol.events.condition.noModifierKeys, ol.events.condition.targetNotEditable);
};
goog.inherits(plugin.position.PositionInteraction, ol.interaction.Interaction);


/**
 * Whether or not this interaction is supported in 3D mode
 * @return {boolean}
 * @override
 */
plugin.position.PositionInteraction.prototype.is3DSupported = function() {
  return true;
};


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} `false` to stop event propagation.
 * @this plugin.position.PositionInteraction
 * @suppress {duplicate}
 */
plugin.position.PositionInteraction.handleEvent = function(mapBrowserEvent) {
  var stopEvent = false;
  if (mapBrowserEvent.type == ol.events.EventType.KEYDOWN && this.condition_(mapBrowserEvent)) {
    var keyCode = mapBrowserEvent.originalEvent.keyCode;
    stopEvent = true;

    switch (keyCode) {
      case goog.events.KeyCodes.PERIOD:
        os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.COPY_COORDINATES_KB, 1);
        plugin.position.launchCopy();
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
