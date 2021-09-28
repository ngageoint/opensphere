goog.declareModuleId('os.layer.LayerType');

/**
 * @enum {string}
 */
const LayerType = {
  TILES: 'Tile Layers',
  GROUPS: 'Tile and Feature Groups',
  FEATURES: 'Feature Layers',
  REF: 'Reference Layers',
  TERRAIN: 'Terrain',
  IMAGE: 'Image',
  VECTOR_TILES: 'Vector Tiles'
};

export default LayerType;
