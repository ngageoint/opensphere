goog.module('os.ui.ogc.wms.IWMSLayer');
goog.module.declareLegacyNamespace();


/**
 * @interface
 */
class IWMSLayer {
  /**
   * Gets the layer title.
   * @return {?string}
   */
  getTitle() {}

  /**
   * Sets the layer title.
   * @param {?string} value
   */
  setTitle(value) {}

  /**
   * Gets the layer name.
   * @return {?string}
   */
  getWmsName() {}

  /**
   * Sets the layer name.
   * @param {?string} value
   */
  setWmsName(value) {}

  /**
   * Gets the layer abstract (description).
   * @return {?string}
   */
  getAbstract() {}

  /**
   * Sets the layer abstract (description).
   * @param {?string} value
   */
  setAbstract(value) {}

  /**
   * Gets the layer attribution.
   * @return {?string}
   */
  getAttribution() {}

  /**
   * Sets the layer attribution.
   * @param {?string} value
   */
  setAttribution(value) {}

  /**
   * @return {?Array.<osx.ogc.TileStyle>}
   */
  getStyles() {}

  /**
   * @param {?Array.<osx.ogc.TileStyle>} value
   */
  setStyles(value) {}

  /**
   * Gets the color of the layer.
   * @return {?string}
   */
  getColor() {}

  /**
   * Sets the color of the layer.
   * @param {?string} value
   */
  setColor(value) {}

  /**
   * @return {boolean}
   */
  getOpaque() {}

  /**
   * @param {boolean} value
   */
  setOpaque(value) {}

  /**
   * @return {Object.<string, string>}
   */
  getDimensions() {}

  /**
   * @param {Object.<string, string>} value
   */
  setDimensions(value) {}

  /**
   * @return {ol.Extent}
   */
  getBBox() {}

  /**
   * @param {ol.Extent} value
   */
  setBBox(value) {}

  /**
   * @return {Array.<string>}
   */
  getKeywords() {}

  /**
   * @param {Array.<string>} value
   */
  setKeywords(value) {}

  /**
   * @return {?Array.<!string>}
   */
  getLegends() {}

  /**
   * @param {?Array.<!string>} value
   */
  setLegends(value) {}

  /**
   * @param {string} key
   * @param {string} value
   */
  addDimension(key, value) {}

  /**
   * @return {boolean}
   */
  isFolder() {}

  /**
   * @return {boolean}
   */
  isBaseLayer() {}

  /**
   * @return {boolean}
   */
  hasTimeExtent() {}

  /**
   * @param {Object} node
   * @param {string=} opt_forcedCrs
   */
  parseBBox(node, opt_forcedCrs) {}

  /**
   * @return {?Array<!string>}
   */
  getSupportedCRS() {}

  /**
   * @param {?Array<!string>} values
   */
  setSupportedCRS(values) {}
}

exports = IWMSLayer;
