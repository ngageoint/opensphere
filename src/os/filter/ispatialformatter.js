goog.provide('os.filter.ISpatialFormatter');



/**
 * Interface for formatting spatial regions for a data source.
 * @interface
 */
os.filter.ISpatialFormatter = function() {};


/**
 * Formats a spatial region.
 * @param {ol.Feature} feature
 * @return {string}
 */
os.filter.ISpatialFormatter.prototype.format;


/**
 * If the formatter supports multiple spatial regions.
 * @return {boolean}
 */
os.filter.ISpatialFormatter.prototype.supportsMultiple;


/**
 * Wraps a string comprised of multiple formatted values.
 * @param {string} value
 * @return {string}
 */
os.filter.ISpatialFormatter.prototype.wrapMultiple;
