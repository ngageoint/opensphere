goog.declareModuleId('os.ui.ogc.wms.LayerParsers');

import WMSLayerParserV111 from './wmslayerparserv111.js';
import WMSLayerParserV130 from './wmslayerparserv130.js';

const {default: IWMSLayerParser} = goog.requireType('os.ui.ogc.wms.IWMSLayerParser');


/**
 * @enum {IWMSLayerParser}
 */
const parsers = {
  '1.1.1': new WMSLayerParserV111(),
  '1.3.0': new WMSLayerParserV130()
};

export default parsers;
