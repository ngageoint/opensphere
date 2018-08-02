goog.provide('os.filter.IFilterCapable');
goog.require('os.filter.IFilter');



/**
 * @interface
 */
os.filter.IFilterCapable = function() {};


/**
 * Adds or replaces a filter on the data.
 * @param {string} key The key (or name) of the filter
 * @param {os.filter.IFilter} filter The filter
 * @return {boolean} If the filter was added.
 */
os.filter.IFilterCapable.prototype.addFilter;


/**
 * Gets a filter by its key
 * @param {string} key The key (or name) of the filter
 * @return {os.filter.IFilter|undefined}
 */
os.filter.IFilterCapable.prototype.getFilter;


/**
 * Gets all the filters
 * @return {Array.<os.filter.IFilter>}
 */
os.filter.IFilterCapable.prototype.getFilters;


/**
 * Removes a filter by its key
 * @param {string} key The key (or name) of the filter
 * @return {boolean} If the filter was removed
 */
os.filter.IFilterCapable.prototype.removeFilter;
