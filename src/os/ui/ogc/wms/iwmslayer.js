goog.provide('os.ui.ogc.wms.IWMSLayer');



/**
 * @interface
 */
os.ui.ogc.wms.IWMSLayer = function() {};


/**
 * @type {string}
 * @const
 */
os.ui.ogc.wms.IWMSLayer.ID = 'os.ui.ogc.wms.IWMSLayer';


/**
 * Gets the layer title.
 * @return {?string}
 */
os.ui.ogc.wms.IWMSLayer.prototype.getTitle;


/**
 * Sets the layer title.
 * @param {?string} value
 */
os.ui.ogc.wms.IWMSLayer.prototype.setTitle;


/**
 * Gets the layer name.
 * @return {?string}
 */
os.ui.ogc.wms.IWMSLayer.prototype.getWmsName;


/**
 * Sets the layer name.
 * @param {?string} value
 */
os.ui.ogc.wms.IWMSLayer.prototype.setWmsName;


/**
 * Gets the layer abstract (description).
 * @return {?string}
 */
os.ui.ogc.wms.IWMSLayer.prototype.getAbstract;


/**
 * Sets the layer abstract (description).
 * @param {?string} value
 */
os.ui.ogc.wms.IWMSLayer.prototype.setAbstract;


/**
 * Gets the layer attribution.
 * @return {?string}
 */
os.ui.ogc.wms.IWMSLayer.prototype.getAttribution;


/**
 * Sets the layer attribution.
 * @param {?string} value
 */
os.ui.ogc.wms.IWMSLayer.prototype.setAttribution;


/**
 * @return {?Array.<osx.ogc.TileStyle>}
 */
os.ui.ogc.wms.IWMSLayer.prototype.getStyles;


/**
 * @param {?Array.<osx.ogc.TileStyle>} value
 */
os.ui.ogc.wms.IWMSLayer.prototype.setStyles;


/**
 * Gets the color of the layer.
 * @return {?string}
 */
os.ui.ogc.wms.IWMSLayer.prototype.getColor;


/**
 * Sets the color of the layer.
 * @param {?string} value
 */
os.ui.ogc.wms.IWMSLayer.prototype.setColor;


/**
 * @return {boolean}
 */
os.ui.ogc.wms.IWMSLayer.prototype.getOpaque;


/**
 * @param {boolean} value
 */
os.ui.ogc.wms.IWMSLayer.prototype.setOpaque;


/**
 * @return {Object.<string, string>}
 */
os.ui.ogc.wms.IWMSLayer.prototype.getDimensions;


/**
 * @param {Object.<string, string>} value
 */
os.ui.ogc.wms.IWMSLayer.prototype.setDimensions;


/**
 * @return {ol.Extent}
 */
os.ui.ogc.wms.IWMSLayer.prototype.getBBox;


/**
 * @param {ol.Extent} value
 */
os.ui.ogc.wms.IWMSLayer.prototype.setBBox;


/**
 * @return {Array.<string>}
 */
os.ui.ogc.wms.IWMSLayer.prototype.getKeywords;


/**
 * @param {Array.<string>} value
 */
os.ui.ogc.wms.IWMSLayer.prototype.setKeywords;


/**
 * @return {?Array.<!string>}
 */
os.ui.ogc.wms.IWMSLayer.prototype.getLegends;


/**
 * @param {?Array.<!string>} value
 */
os.ui.ogc.wms.IWMSLayer.prototype.setLegends;


/**
 * @param {string} key
 * @param {string} value
 */
os.ui.ogc.wms.IWMSLayer.prototype.addDimension;


/**
 * @return {boolean}
 */
os.ui.ogc.wms.IWMSLayer.prototype.isFolder;


/**
 * @return {boolean}
 */
os.ui.ogc.wms.IWMSLayer.prototype.isBaseLayer;


/**
 * @return {boolean}
 */
os.ui.ogc.wms.IWMSLayer.prototype.hasTimeExtent;


/**
 * @param {Object} node
 * @param {string=} opt_forcedCrs
 */
os.ui.ogc.wms.IWMSLayer.prototype.parseBBox;


/**
 * @return {?Array<!string>}
 */
os.ui.ogc.wms.IWMSLayer.prototype.getSupportedCRS = goog.abstractMethod;


/**
 * @param {?Array<!string>} values
 */
os.ui.ogc.wms.IWMSLayer.prototype.setSupportedCRS;
