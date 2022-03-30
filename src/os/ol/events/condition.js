goog.declareModuleId('os.ol.events.condition');

import MapBrowserEventType from 'ol/src/MapBrowserEventType.js';

/**
 * If a map browser event is for a right click.
 *
 * @param {MapBrowserEvent} mapBrowserEvent The map browser event
 * @return {boolean} If the event represents a right click
 */
export const rightClick = function(mapBrowserEvent) {
  return !!mapBrowserEvent && (mapBrowserEvent.type === MapBrowserEventType.POINTERUP ||
      mapBrowserEvent.type === MapBrowserEventType.POINTERDOWN) &&
      mapBrowserEvent.originalEvent instanceof PointerEvent && mapBrowserEvent.originalEvent.button === 2;
};
