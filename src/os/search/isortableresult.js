goog.provide('os.search.ISortableResult');



/**
 * Interface representing a sortable search result.
 * @interface
 * @template T
 */
os.search.ISortableResult = function() {};


/**
 * ID for {@see os.implements}
 * @const {string}
 */
os.search.ISortableResult.ID = 'os.search.ISortableResult';


/**
 * Get the value for a sort type.
 * @param {string} sortType The sort type.
 * @return {?string} The sort value, or null if the value doesn't exist or sort type is not supported.
 */
os.search.ISortableResult.prototype.getSortValue;
