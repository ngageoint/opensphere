goog.declareModuleId('os.ui.ogc.wms.IWMSLayerParser');

const {default: IWMSLayer} = goog.requireType('os.ui.ogc.wms.IWMSLayer');


/**
 * @interface
 */
export default class IWMSLayerParser {
  /**
   * @param {Object} node
   * @return {?string}
   */
  parseLayerId(node) {}

  /**
   * @param {Object} node
   * @return {?string}
   */
  parseLayerTitle(node) {}

  /**
   * @param {Object} node
   * @param {IWMSLayer} layer
   */
  parseLayer(node, layer) {}
}
