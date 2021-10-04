goog.declareModuleId('os.search.ISortableResult');

/**
 * Interface representing a sortable search result.
 * @interface
 * @template T
 */
export default class ISortableResult {
  /**
   * Get the value for a sort type.
   * @param {string} sortType The sort type.
   * @return {?string} The sort value, or null if the value doesn't exist or sort type is not supported.
   */
  getSortValue(sortType) {}
}

/**
 * ID for {@see os.implements}
 * @const {string}
 */
ISortableResult.ID = 'os.search.ISortableResult';
