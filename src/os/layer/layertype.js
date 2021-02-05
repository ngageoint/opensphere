goog.provide('os.layer.ExplicitLayerType');
goog.provide('os.layer.LayerType');


/**
 * @enum {string}
 */
os.layer.LayerType = {
  TILES: 'Tile Layers',
  GROUPS: 'Tile and Feature Groups',
  FEATURES: 'Feature Layers',
  REF: 'Reference Layers',
  TERRAIN: 'Terrain',
  IMAGE: 'Image',
  VECTOR_TILES: 'Vector Tiles'
};


/**
 * @enum {string}
 */
os.layer.ExplicitLayerType = {
  TILES: 'Tiles',
  FEATURES: 'Features',
  IMAGE: 'Image',
  VECTOR_TILES: 'Vector Tiles'
};
