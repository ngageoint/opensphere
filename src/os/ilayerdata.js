goog.declareModuleId('os.ILayerData');


/**
 * @interface
 */
export default class ILayerData {
  /**
   * The map layer tied to the command.
   * @type {import("ol/layer/Layer")}
   */
  layer() {}

  /**
   * The configuration for the map layer.
   * @type {Object}
   */
  layerOptions() {}
}
