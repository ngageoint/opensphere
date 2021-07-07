goog.module('os.ILayerData');
goog.module.declareLegacyNamespace();

const Layer = goog.requireType('ol.layer.Layer');

/**
 * @interface
 */
class ILayerData {
  /**
   * The map layer tied to the command.
   * @type {Layer}
   */
  layer() {}

  /**
   * The configuration for the map layer.
   * @type {Object}
   */
  layerOptions() {}
}

exports = ILayerData;
