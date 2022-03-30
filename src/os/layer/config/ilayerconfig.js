goog.declareModuleId('os.layer.config.ILayerConfig');

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
