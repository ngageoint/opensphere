goog.provide('os.filter.IFilterFormatter');



/**
 * Interface for formatting filters
 * @interface
 */
os.filter.IFilterFormatter = function() {};


/**
 * Formats a filter
 * @param {!os.filter.FilterEntry} filter
 * @return {!string}
 */
os.filter.IFilterFormatter.prototype.format;


/**
 * Wraps a set of filters in a group
 * @param {!string} filter
 * @param {boolean} group True for AND, false for OR
 * @return {!string}
 */
os.filter.IFilterFormatter.prototype.wrap;


/**
 * Wraps a set of filters/boxes in an AND
 * @param {!string} filter
 * @return {!string}
 */
os.filter.IFilterFormatter.prototype.wrapAll;
