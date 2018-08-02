goog.provide('os.ui.ogc.wms.IWMSLayerParser');
goog.require('os.ui.ogc.wms.IWMSLayer');



/**
 * @interface
 */
os.ui.ogc.wms.IWMSLayerParser = function() {};


/**
 * @param {Object} node
 * @return {?string}
 */
os.ui.ogc.wms.IWMSLayerParser.prototype.parseLayerId;


/**
 * @param {Object} node
 * @return {?string}
 */
os.ui.ogc.wms.IWMSLayerParser.prototype.parseLayerTitle;


/**
 * @param {Object} node
 * @param {os.ui.ogc.wms.IWMSLayer} layer
 */
os.ui.ogc.wms.IWMSLayerParser.prototype.parseLayer;
