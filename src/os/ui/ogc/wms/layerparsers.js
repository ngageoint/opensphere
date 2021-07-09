goog.module('os.ui.ogc.wms.LayerParsers');
goog.module.declareLegacyNamespace();

const WMSLayerParserV111 = goog.require('os.ui.ogc.wms.WMSLayerParserV111');
const WMSLayerParserV130 = goog.require('os.ui.ogc.wms.WMSLayerParserV130');

const IWMSLayerParser = goog.requireType('os.ui.ogc.wms.IWMSLayerParser');

/**
 * @enum {IWMSLayerParser}
 */
const parsers = {
  '1.1.1': new WMSLayerParserV111(),
  '1.3.0': new WMSLayerParserV130()
};

exports = parsers;
