goog.declareModuleId('os.ogc.wmts.WMTSLayerParsers');

import WMTSLayerParserV100 from './wmtslayerparserv100.js';

const {default: IWMTSLayerParser} = goog.requireType('os.ogc.wmts.IWMTSLayerParser');


/**
 * WMTS layer parsers.
 * @type {!Object<string, function(new: IWMTSLayerParser)>}
 */
const WMTSLayerParsers = {
  '1.0.0': WMTSLayerParserV100
};

export default WMTSLayerParsers;
