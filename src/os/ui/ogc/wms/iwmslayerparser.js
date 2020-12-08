goog.module('os.ui.ogc.wms.IWMSLayerParser');
goog.module.declareLegacyNamespace();

const IWMSLayer = goog.requireType('os.ui.ogc.wms.IWMSLayer');


/**
 * @interface
 */
class IWMSLayerParser {
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

exports = IWMSLayerParser;
