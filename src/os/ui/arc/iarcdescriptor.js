goog.provide('os.ui.arc.IARCDescriptor');

goog.require('os.data.IDataDescriptor');
goog.require('os.data.IServerDescriptor');
goog.require('os.filter.IFilterable');
goog.require('os.ui.ogc.IFeatureTypeDescriptor');

/**
 * Interface for ARC data descriptors
 *
 * @interface
 * @extends {os.data.IDataDescriptor}
 * @extends {os.data.IServerDescriptor}
 * @extends {os.filter.IFilterable}
 * @extends {os.ui.ogc.IFeatureTypeDescriptor}
 */
os.ui.arc.IARCDescriptor = function() {};

/**
 * @type {string}
 * @const
 */
os.ui.arc.IARCDescriptor.ID = 'os.ui.arc.IARCDescriptor';

/**
 * Set the url
 * @param {?string} value
 */
os.ui.arc.IARCDescriptor.prototype.setUrl;

/**
 * Get the url
 * @return {?string}
 */
os.ui.arc.IARCDescriptor.prototype.getUrl;

/**
 * Set deprecated
 * @param {boolean} value
 */
os.ui.arc.IARCDescriptor.prototype.setDeprecated;

/**
 * Get deprecated
 * @return {boolean}
 */
os.ui.arc.IARCDescriptor.prototype.getDeprecated;

