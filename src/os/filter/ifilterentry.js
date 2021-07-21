goog.module('os.filter.IFilterEntry');
goog.module.declareLegacyNamespace();


/**
 * @interface
 */
class IFilterEntry {
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

exports = IFilterEntry;
