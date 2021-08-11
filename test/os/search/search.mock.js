goog.module('os.search.MockSearch');
goog.module.declareLegacyNamespace();

const GoogEvent = goog.require('goog.events.Event');
const AbstractSearch = goog.require('os.search.AbstractSearch');
const SearchEvent = goog.require('os.search.SearchEvent');
const SearchEventType = goog.require('os.search.SearchEventType');


/**
 */
class MockSearch extends AbstractSearch {
  /**
   * Constructor.
   * @param {string} id The unique identifier for the search provider.
   * @param {string} name The user-facing name of the search provider.
   * @param {string} value The result value
   * @param {number} score The result score
   */
  constructor(id, name, value, score) {
    super(id, name, 'test', 100);
    this.id_ = id;
    this.name_ = name;
    this.value_ = value;
    this.score_ = score;
  }

  /**
   * @inheritDoc
   */
  searchTerm(term, opt_start, opt_pageSize) {
    var pageSize = (opt_pageSize != undefined) ? opt_pageSize : 25;
    var results = [];

    this.dispatchEvent(new GoogEvent(SearchEventType.START));

    var score = this.score_;
    for (var i = 0; i < pageSize; i++) {
      results.push({
        value: this.value_,
        getScore: () => score,
        setScore: function(score) {}
      });
    }

    this.dispatchEvent(new SearchEvent(SearchEventType.SUCCESS, term, results, 500));
    return true;
  }

  /**
   * @inheritDoc
   */
  searchFavorite(term, opt_start, opt_pageSize) {
    this.dispatchEvent(new GoogEvent(SearchEventType.START));

    var score = this.score_;
    for (var i = 0; i < pageSize; i++) {
      results.push({
        value: this.value_,
        getScore: () => score
      });
    }

    this.dispatchEvent(new SearchEvent(SearchEventType.SUCCESS, term, results, 500));
    return true;
  }

  /**
   * @inheritDoc
   */
  cancel() {
    // this is all synchronous, but this method is defined by ISearch
  }

  /**
   * @inheritDoc
   */
  autocomplete(term, opt_maxResults) {
    var pageSize = opt_maxResults !== undefined ? opt_maxResults : 25;
    var results = [];

    for (var i = 0; i < pageSize; i++) {
      results.push({value: this.value_});
    }

    this.dispatchEvent(new SearchEvent(SearchEventType.AUTOCOMPLETED, term, results, pageSize));
  }
}

exports = MockSearch;
