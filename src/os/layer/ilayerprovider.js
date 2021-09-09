goog.module('os.layer.ILayerProvider');

const ILayer = goog.requireType('os.layer.ILayer');


/**
 * @interface
 */
class ILayerProvider {
  /**
   * Get the layer associated with this class.
   * @return {ILayer} The layer.
   */
  getLayer() {}
}

/**
 * The interface identifier.
 * @type {string}
 * @const
 */
ILayerProvider.ID = 'os.layer.ILayerProvider';

exports = ILayerProvider;
