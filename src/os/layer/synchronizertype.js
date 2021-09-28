goog.declareModuleId('os.layer.SynchronizerType');

/**
 * Enumeration of available base synchronizer types.
 * @enum {string}
 * @const
 */
const SynchronizerType = {
  VECTOR: 'vector',
  VECTOR_TILE: 'vectortile',
  TILE: 'tile',
  IMAGE: 'image',
  IMAGE_STATIC: 'imageStatic',
  DRAW: 'draw'
};

export default SynchronizerType;
