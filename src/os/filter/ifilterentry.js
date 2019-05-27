goog.provide('os.filter.IFilterEntry');



/**
 * @interface
 */
os.filter.IFilterEntry = function() {};


/**
 * @return {string}
 */
os.filter.IFilterEntry.prototype.getTitle;


/**
 * @param {string} value
 */
os.filter.IFilterEntry.prototype.setTitle;


/**
 * @return {?string}
 */
os.filter.IFilterEntry.prototype.getDescription;


/**
 * @param {?string} value
 */
os.filter.IFilterEntry.prototype.setDescription;


/**
 * @return {?string} The filter
 */
os.filter.IFilterEntry.prototype.getFilter;


/**
 * @param {?string} filter
 */
os.filter.IFilterEntry.prototype.setFilter;
