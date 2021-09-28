goog.declareModuleId('os.MapEvent');

/**
 * OpenSphere map events.
 * @enum {string}
 */
const MapEvent = {
  GL_REPAINT: 'map:glRepaint',
  MAP_READY: 'map:ready',
  RENDER: 'map:render',
  RENDER_SYNC: 'map:renderSync',
  VIEW_CHANGE: 'map:viewChange',
  TERRAIN_DISABLED: 'map:terrainDisabled'
};

export default MapEvent;
