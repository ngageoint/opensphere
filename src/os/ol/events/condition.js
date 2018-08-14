goog.provide('os.ol.events.condition');

goog.require('ol.MapBrowserEventType');


/**
 * If a map browser event is for a right click.
 * @param {ol.MapBrowserEvent} mapBrowserEvent The map browser event
 * @return {boolean} If the event represents a right click
 */
os.ol.events.condition.rightClick = function(mapBrowserEvent) {
  return !!mapBrowserEvent && (mapBrowserEvent.type === ol.MapBrowserEventType.POINTERUP ||
      mapBrowserEvent.type === ol.MapBrowserEventType.POINTERDOWN) &&
      !!mapBrowserEvent.pointerEvent && mapBrowserEvent.pointerEvent.button === 2;
};
