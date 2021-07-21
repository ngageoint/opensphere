goog.module('os.filter.IFilter');
goog.module.declareLegacyNamespace();


/**
 * An interface for describing an array filter.
 *
 * @template T
 * @interface
 */
class IFilter {
  /**
   * @param {T} item The item being evaluated
   * @param {number} index The item's index in its array
   * @param {Array<T>} array Array containing the item
   * @return {boolean}
   */
  evaluate(item, index, array) {}

  /**
   * Get the filter id.
   * @return {!string} The filter id
   */
  getId() {}

  /**
   * Set the filter id.
   * @param {!string} id The filter id
   */
  setId(id) {}
}

exports = IFilter;
