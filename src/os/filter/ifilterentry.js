goog.declareModuleId('os.filter.IFilterEntry');

/**
 * @interface
 */
export default class IFilterEntry {
  /**
   * @return {string}
   */
  getTitle() {}

  /**
   * @param {string} value
   */
  setTitle(value) {}

  /**
   * @return {?string}
   */
  getDescription() {}

  /**
   * @param {?string} value
   */
  setDescription(value) {}

  /**
   * @return {?string} The filter
   */
  getFilter() {}

  /**
   * @param {?string} filter
   */
  setFilter(filter) {}
}
