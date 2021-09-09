goog.module('os.layer.config.ILayerConfig');

const Layer = goog.requireType('ol.layer.Layer');


/**
 * @interface
 */
class ILayerConfig {
  /**
   * @param {Object<string, *>} options Layer configuration options.
   * @return {Layer}
   */
  createLayer(options) {}
}

exports = ILayerConfig;
