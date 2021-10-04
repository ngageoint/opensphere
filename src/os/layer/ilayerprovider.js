goog.declareModuleId('os.layer.ILayerProvider');

const {default: ILayer} = goog.requireType('os.layer.ILayer');


/**
 * @interface
 */
export default class ILayerProvider {
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
