goog.module('os.filter.IFilterCapable');
goog.module.declareLegacyNamespace();

const IFilter = goog.requireType('os.filter.IFilter');

/**
 * @interface
 */
class IFilterCapable {
  /**
   * Adds or replaces a filter on the data.
   * @param {string} key The key (or name) of the filter
   * @param {IFilter} filter The filter
   * @return {boolean} If the filter was added.
   */
  addFilter(key, filter) {}

  /**
   * Gets a filter by its key
   * @param {string} key The key (or name) of the filter
   * @return {IFilter|undefined}
   */
  getFilter(key) {}

  /**
   * Gets all the filters
   * @return {Array<IFilter>}
   */
  getFilters() {}

  /**
   * Removes a filter by its key
   * @param {string} key The key (or name) of the filter
   * @return {boolean} If the filter was removed
   */
  removeFilter(key) {}
}

exports = IFilterCapable;
