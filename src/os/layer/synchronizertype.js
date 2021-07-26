goog.module('os.layer.SynchronizerType');
goog.module.declareLegacyNamespace();

/**
 * Enumeration of available base synchronizer types.
 * @enum {string}
 * @const
 */
exports = {
  VECTOR: 'vector',
  VECTOR_TILE: 'vectortile',
  TILE: 'tile',
  IMAGE: 'image',
  IMAGE_STATIC: 'imageStatic',
  DRAW: 'draw'
};
