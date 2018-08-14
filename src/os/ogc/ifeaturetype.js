goog.provide('os.ogc.FeatureTypeColumn');
goog.provide('os.ogc.IFeatureType');
goog.require('os.IPersistable');


/**
 * @typedef {{name: !string, type: !string}}
 */
os.ogc.FeatureTypeColumn;



/**
 * @interface
 * @extends {os.IPersistable}
 */
os.ogc.IFeatureType = function() {};


/**
 * @return {?string}
 */
os.ogc.IFeatureType.prototype.getTypeName;


/**
 * @param {?string} value
 */
os.ogc.IFeatureType.prototype.setTypeName;


/**
 * @return {Array}
 */
os.ogc.IFeatureType.prototype.getTimeColumns;


/**
 * @return {?string}
 */
os.ogc.IFeatureType.prototype.getGeometryColumnName;


/**
 * @param {?string} value
 */
os.ogc.IFeatureType.prototype.setGeometryColumnName;


/**
 * @return {?string}
 */
os.ogc.IFeatureType.prototype.getStartDateColumnName;


/**
 * @param {?string} value
 */
os.ogc.IFeatureType.prototype.setStartDateColumnName;


/**
 * @return {?string}
 */
os.ogc.IFeatureType.prototype.getEndDateColumnName;


/**
 * @param {?string} value
 */
os.ogc.IFeatureType.prototype.setEndDateColumnName;


/**
 * @return {Array<!os.ogc.FeatureTypeColumn>}
 */
os.ogc.IFeatureType.prototype.getColumns;


/**
 * @param {Array<!os.ogc.FeatureTypeColumn>} value
 */
os.ogc.IFeatureType.prototype.setColumns;


/**
 * @return {boolean}
 */
os.ogc.IFeatureType.prototype.getNeedsTimeColumns;
