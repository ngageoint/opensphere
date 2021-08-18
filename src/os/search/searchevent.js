goog.module('os.search.SearchEvent');
goog.module.declareLegacyNamespace();

const GoogEvent = goog.require('goog.events.Event');
const ISearchResult = goog.requireType('os.search.ISearchResult');


/**
 */
class SearchEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {string} type The event type
   * @param {?string} term The query term of the search
   * @param {Array<ISearchResult>=} opt_results The search results
   * @param {number=} opt_total Total number of results, regardless of page size. If not provided, the length of the
   *   results array will be used.
   * @param {Object=} opt_target Reference to the object that is the target of this event
   */
  constructor(type, term, opt_results, opt_total, opt_target) {
    super(type, opt_target);

    /**
     * @type {Array<ISearchResult>}
     * @private
     */
    this.results_ = opt_results || [];

    /**
     * @type {?string}
     * @private
     */
    this.term_ = term;

    /**
     * @type {number}
     * @private
     */
    this.total_ = opt_total !== undefined ? opt_total : opt_results ? opt_results.length : 0;
  }

  /**
   * @return {?string}
   */
  getTerm() {
    return this.term_;
  }

  /**
   * @return {?string}
   */
  getSearchTerm() {
    return this.term_;
  }

  /**
   * @return {Array<ISearchResult>}
   */
  getResults() {
    return this.results_;
  }

  /**
   * Retrieve the total number of search results, regardless of page size
   *
   * @return {number} The total number of search results.
   */
  getTotal() {
    return this.total_;
  }
}

exports = SearchEvent;
