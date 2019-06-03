goog.provide('os.filter.IFilterable');


/**
 * @typedef {function(...)}
 */
os.filter.FilterLauncherFn;


/**
 * @typedef {function(...):?Array<os.ogc.FeatureTypeColumn>}
 */
os.filter.FilterColumnsFn;



/**
 * @interface
 */
os.filter.IFilterable = function() {};


/**
 * @type {string}
 * @const
 */
os.filter.IFilterable.ID = 'os.filter.IFilterable';


/**
 * @return {?string} The title of the filterable.
 */
os.filter.IFilterable.prototype.getTitle;


/**
 * @return {boolean} Whether or not this class is filterable
 */
os.filter.IFilterable.prototype.isFilterable;


/**
 * @return {?string} The filter key to uniquely identify this filterable
 */
os.filter.IFilterable.prototype.getFilterKey;


/**
 * Launches the filter manager for this class
 */
os.filter.IFilterable.prototype.launchFilterManager;


/**
 * Get filter columns
 * @return {?Array<os.ogc.FeatureTypeColumn>} the columns
 */
os.filter.IFilterable.prototype.getFilterColumns;


/**
 * Get filterable types
 * @return {!Array<!string>} the list of filterable types
 */
os.filter.IFilterable.prototype.getFilterableTypes;
