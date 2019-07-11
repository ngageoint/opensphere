goog.provide('os.search.ISequentialPagingSearch');



/**
 * The base interface for sequential paging providers
 * @interface
 */
os.search.ISequentialPagingSearch = function() {};


/**
 * ID for the interface
 * @const {string}
 */
os.search.ISequentialPagingSearch.ID = 'os.search.ISequentialPagingSearch';


/**
 * Does the search provider only support sequential access to paged results
 * @return {boolean}
 */
os.search.ISequentialPagingSearch.prototype.useSequentialPaging;


/**
 * Set if search provider only supports sequential access to paged results
 * @param {boolean} sequentialPaging
 */
os.search.ISequentialPagingSearch.prototype.setSequentialPaging;
