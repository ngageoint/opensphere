goog.declareModuleId('os.ILayerData');

const Layer = goog.requireType('ol.layer.Layer');


/**
 * @interface
 */
export default class ILayerData {
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
