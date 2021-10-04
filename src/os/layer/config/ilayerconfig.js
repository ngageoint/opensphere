goog.declareModuleId('os.layer.config.ILayerConfig');

const Layer = goog.requireType('ol.layer.Layer');


/**
 * @interface
 */
export default class ILayerConfig {
  /**
   * @param {Object<string, *>} options Layer configuration options.
   * @return {Layer}
   */
  createLayer(options) {}
}
