goog.module('os.ol.events.condition');
goog.module.declareLegacyNamespace();

const MapBrowserEventType = goog.require('ol.MapBrowserEventType');


/**
 * If a map browser event is for a right click.
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent The map browser event
 * @return {boolean} If the event represents a right click
 */
const rightClick = function(mapBrowserEvent) {
  return !!mapBrowserEvent && (mapBrowserEvent.type === MapBrowserEventType.POINTERUP ||
      mapBrowserEvent.type === MapBrowserEventType.POINTERDOWN) &&
      !!mapBrowserEvent.pointerEvent && mapBrowserEvent.pointerEvent.button === 2;
};

exports = {
  rightClick
};
