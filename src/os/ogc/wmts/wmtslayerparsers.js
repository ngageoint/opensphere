goog.module('os.ogc.wmts.WMTSLayerParsers');
goog.module.declareLegacyNamespace();

const {default: WMTSLayerParserV100} = goog.require('os.ogc.wmts.WMTSLayerParserV100');

const {default: IWMTSLayerParser} = goog.requireType('os.ogc.wmts.IWMTSLayerParser');


/**
 * WMTS layer parsers.
 * @type {!Object<string, function(new: IWMTSLayerParser)>}
 */
exports = {
  '1.0.0': WMTSLayerParserV100
};
