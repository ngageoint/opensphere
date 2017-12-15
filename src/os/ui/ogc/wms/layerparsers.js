goog.provide('os.ui.ogc.wms.LayerParsers');
goog.require('os.ui.ogc.wms.WMSLayerParserV111');
goog.require('os.ui.ogc.wms.WMSLayerParserV130');


/**
 * @enum {os.ui.ogc.wms.IWMSLayerParser}
 * @const
 */
os.ui.ogc.wms.LayerParsers = {
  '1.1.1': new os.ui.ogc.wms.WMSLayerParserV111(),
  '1.3.0': new os.ui.ogc.wms.WMSLayerParserV130()
};
