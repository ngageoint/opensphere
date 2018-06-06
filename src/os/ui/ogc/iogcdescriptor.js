goog.provide('os.ui.ogc.IOGCDescriptor');

goog.require('os.data.IDataDescriptor');
goog.require('os.data.IServerDescriptor');
goog.require('os.filter.IFilterable');
goog.require('os.ui.ogc.IFeatureType');
goog.require('os.ui.ogc.wms.IWMSLayer');



/**
 * Interface for OGC data descriptors.
 * @interface
 * @extends {os.data.IDataDescriptor}
 * @extends {os.data.IServerDescriptor}
 * @extends {os.filter.IFilterable}
 * @extends {os.ui.ogc.IFeatureType}
 * @extends {os.ui.ogc.wms.IWMSLayer}
 */
os.ui.ogc.IOGCDescriptor = function() {};


/**
 * @type {string}
 * @const
 */
os.ui.ogc.IOGCDescriptor.ID = 'os.ui.ogc.IOGCDescriptor';


/**
 * @param {?function()} fn The callback to call when the DescribeFeatureType completes.
 */
os.ui.ogc.IOGCDescriptor.prototype.setDescribeCallback;


/**
 * If WFS is enabled.
 * @return {boolean}
 */
os.ui.ogc.IOGCDescriptor.prototype.isWfsEnabled;


/**
 * Set if WFS is enabled.
 * @param {boolean} value
 */
os.ui.ogc.IOGCDescriptor.prototype.setWfsEnabled;


/**
 * Get the WFS type name.
 * @return {?string}
 */
os.ui.ogc.IOGCDescriptor.prototype.getWfsName;


/**
 * Set the WFS type name.
 * @param {?string} value
 */
os.ui.ogc.IOGCDescriptor.prototype.setWfsName;


/**
 * Get the WFS namespace.
 * @return {?string}
 */
os.ui.ogc.IOGCDescriptor.prototype.getWfsNamespace;


/**
 * Set the WFS namespace.
 * @param {?string} value
 */
os.ui.ogc.IOGCDescriptor.prototype.setWfsNamespace;


/**
 * Get the WFS URL.
 * @return {?string}
 */
os.ui.ogc.IOGCDescriptor.prototype.getWfsUrl;


/**
 * Set the WFS URL.
 * @param {?string} value
 */
os.ui.ogc.IOGCDescriptor.prototype.setWfsUrl;


/**
 * Get the list of WFS output formats
 * @return {?Array<string>} formats
 */
os.ui.ogc.IOGCDescriptor.prototype.getWfsFormats;


/**
 * Set the list of WFS output formats
 * @param {?Array<string>} value
 */
os.ui.ogc.IOGCDescriptor.prototype.setWfsFormats;


/**
 * If WMS is enabled.
 * @return {boolean}
 */
os.ui.ogc.IOGCDescriptor.prototype.isWmsEnabled;


/**
 * Set if WMS is enabled.
 * @param {boolean} value
 */
os.ui.ogc.IOGCDescriptor.prototype.setWmsEnabled;


/**
 * @return {!string} The WMS version
 */
os.ui.ogc.IOGCDescriptor.prototype.getWmsVersion;


/**
 * @param {?string} value The WMS version
 */
os.ui.ogc.IOGCDescriptor.prototype.setWmsVersion;


/**
 * Get the date format for WMS requests.
 * @return {?string}
 */
os.ui.ogc.IOGCDescriptor.prototype.getWmsDateFormat;


/**
 * Set the date format for WMS requests.
 * @param {?string} value
 */
os.ui.ogc.IOGCDescriptor.prototype.setWmsDateFormat;


/**
 * Get the additional WMS parameters to include in requests.
 * @return {?goog.Uri.QueryData}
 */
os.ui.ogc.IOGCDescriptor.prototype.getWmsParams;


/**
 * Set the additional WMS parameters to include in requests.
 * @param {?goog.Uri.QueryData} value
 */
os.ui.ogc.IOGCDescriptor.prototype.setWmsParams;


/**
 * Get the WMS type name.
 * @return {?string}
 */
os.ui.ogc.IOGCDescriptor.prototype.getWmsName;


/**
 * Set the WMS type name.
 * @param {?string} value
 */
os.ui.ogc.IOGCDescriptor.prototype.setWmsName;


/**
 * Get the time format for WMS requests.
 * @return {?string}
 */
os.ui.ogc.IOGCDescriptor.prototype.getWmsTimeFormat;


/**
 * Set the time format for WMS requests.
 * @param {?string} value
 */
os.ui.ogc.IOGCDescriptor.prototype.setWmsTimeFormat;


/**
 * Get the WMS URL.
 * @return {?string}
 */
os.ui.ogc.IOGCDescriptor.prototype.getWmsUrl;


/**
 * Set the WMS URL.
 * @param {?string} value
 */
os.ui.ogc.IOGCDescriptor.prototype.setWmsUrl;


/**
 * Get if requests should use POST instead of GET.
 * @return {boolean}
 */
os.ui.ogc.IOGCDescriptor.prototype.getUsePost;


/**
 * Set if requests should use POST instead of GET.
 * @param {boolean} value
 */
os.ui.ogc.IOGCDescriptor.prototype.setUsePost;


/**
 * @return {?string}
 */
os.ui.ogc.IOGCDescriptor.prototype.getLayerName;


/**
 * @return {?string}
 */
os.ui.ogc.IOGCDescriptor.prototype.getUrlKey;


/**
 * Get deprecated
 * @return {boolean}
 */
os.ui.ogc.IOGCDescriptor.prototype.getDeprecated;


/**
 * Set deprecated
 * @param {boolean} value
 */
os.ui.ogc.IOGCDescriptor.prototype.setDeprecated;
