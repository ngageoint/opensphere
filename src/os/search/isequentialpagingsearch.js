goog.module('os.search.ISequentialPagingSearch');


/**
 * The base interface for sequential paging providers
 * @interface
 */
class ISequentialPagingSearch {
  /**
   * Does the search provider only support sequential access to paged results
   * @return {boolean}
   */
  useSequentialPaging() {}

  /**
   * Set if search provider only supports sequential access to paged results
   * @param {boolean} sequentialPaging
   */
  setSequentialPaging(sequentialPaging) {}
}

/**
 * ID for the interface
 * @const {string}
 */
ISequentialPagingSearch.ID = 'os.search.ISequentialPagingSearch';

exports = ISequentialPagingSearch;
