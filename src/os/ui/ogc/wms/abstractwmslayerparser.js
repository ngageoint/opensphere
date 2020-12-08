goog.module('os.ui.ogc.wms.AbstractWMSLayerParser');
goog.module.declareLegacyNamespace();

goog.require('os.ui.ogc.IOGCDescriptor');

const ui = goog.require('os.ui');
const IWMSLayer = goog.requireType('os.ui.ogc.wms.IWMSLayer');
const IWMSLayerParser = goog.requireType('os.ui.ogc.wms.IWMSLayerParser');



/**
 * @abstract
 * @implements {IWMSLayerParser}
 */
class AbstractWMSLayerParser {
  /**
   * Constructor.
   */
  constructor() {}

  /**
   * @inheritDoc
   */
  parseLayerId(node) {
    return /** @type {string} */ (node['Name']);
  }

  /**
   * @inheritDoc
   */
  parseLayerTitle(node) {
    return /** @type {string}{ */ (node['Title']);
  }

  /**
   * @abstract
   * @inheritDoc
   */
  parseLayer(node, layer) {}

  /**
   * @param {Object} node The JSON object node for the layer
   * @param {IWMSLayer} layer The layer
   */
  addAttribution(node, layer) {
    if (node) {
      var text = /** @type {string} */ (goog.object.getValueByKeys(node, ['Attribution', 'Title']) || '');

      if (text) {
        var link = /** @type {string} */ (goog.object.getValueByKeys(node, ['Attribution', 'OnlineResource']) || '');

        if (link) {
          text = '<a href="' + link + '" target="_blank">' + text + '</a>';
        }

        layer.setAttribution(ui.sanitize(text));
      }
    }
  }
}

exports = AbstractWMSLayerParser;
