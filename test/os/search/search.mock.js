goog.provide('os.search.MockSearch');

goog.require('os.mock');
goog.require('os.search.AbstractSearch');
goog.require('os.search.SearchEvent');
goog.require('os.search.SearchEventType');



/**
 * @param {string} id The unique identifier for the search provider.
 * @param {string} name The user-facing name of the search provider.
 * @param {string} value The result value
 * @param {number} score The result score
 * @extends {os.search.AbstractSearch}
 * @constructor
 */
os.search.MockSearch = function(id, name, value, score) {
  goog.base(this, id, name, 'test', 100);
  this.id_ = id;
  this.name_ = name;
  this.value_ = value;
  this.score_ = score;
};
goog.inherits(os.search.MockSearch, os.search.AbstractSearch);


/**
 * @inheritDoc
 */
os.search.MockSearch.prototype.searchTerm = function(term, opt_start, opt_pageSize) {
  var pageSize = (opt_pageSize != undefined) ? opt_pageSize : 25;
  var results = [];

  this.dispatchEvent(new goog.events.Event(os.search.SearchEventType.START));

  var score = this.score_;
  for (var i = 0; i < pageSize; i++) {
    results.push({
      value: this.value_,
      getScore: function() { return score; },
      setScore: function(score) {}
    });
  }

  this.dispatchEvent(
      new os.search.SearchEvent(
          os.search.SearchEventType.SUCCESS,
          term,
          results,
          500));
  return true;
};


/**
 * @inheritDoc
 */
os.search.MockSearch.prototype.searchFavorite = function(term, opt_start, opt_pageSize) {
  this.dispatchEvent(new goog.events.Event(os.search.SearchEventType.START));

  var score = this.score_;
  for (var i = 0; i < pageSize; i++) {
    results.push({
      value: this.value_,
      getScore: function() { return score; }
    });
  }

  this.dispatchEvent(
      new os.search.SearchEvent(
          os.search.SearchEventType.SUCCESS,
          term,
          results,
          500));
  return true;
};


/**
 * @inheritDoc
 */
os.search.MockSearch.prototype.cancel = function() {
  // this is all synchronous, but this method is defined by ISearch
};


/**
 * @inheritDoc
 */
os.search.MockSearch.prototype.autocomplete = function(term, opt_maxResults) {
  var pageSize = goog.isDef(opt_maxResults) ? opt_maxResults : 25;
  var results = [];

  for (var i = 0; i < pageSize; i++) {
    results.push({ value: this.value_ });
  }

  this.dispatchEvent(new os.search.SearchEvent(os.search.SearchEventType.AUTOCOMPLETED, term, results,
      pageSize));
};
