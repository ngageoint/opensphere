goog.provide('os.filter.IFilter');



/**
 * An interface for describing an array filter.
 * @template T
 * @interface
 */
os.filter.IFilter = function() {};


/**
 * @param {T} item The item being evaluated
 * @param {number} index The item's index in its array
 * @param {Array.<T>} array Array containing the item
 * @return {boolean}
 */
os.filter.IFilter.prototype.evaluate;


/**
 * Get the filter id.
 * @return {!string} The filter id
 */
os.filter.IFilter.prototype.getId;


/**
 * Set the filter id.
 * @param {!string} id The filter id
 */
os.filter.IFilter.prototype.setId;
