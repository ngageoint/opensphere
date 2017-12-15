goog.provide('os.search.AbstractUrlSearch');

goog.require('goog.events.Event');
goog.require('goog.net.EventType');
goog.require('os.net.Request');
goog.require('os.search.AbstractSearch');
goog.require('os.search.SearchEvent');
goog.require('os.search.SearchEventType');



/**
 * @param {string} id The unique identifier for the search provider.
 * @param {string} name The user-facing name of the search provider.
 * @extends {os.search.AbstractSearch}
 * @constructor
 */
os.search.AbstractUrlSearch = function(id, name) {
  os.search.AbstractUrlSearch.base(this, 'constructor', id, name);

  /**
   * @type {Array<os.search.ISearchResult>}
   * @protected
   */
  this.results = [];

  /**
   * @type {Array}
   * @protected
   */
  this.acResults = [];

  /**
   * @type {?os.net.Request}
   * @protected
   */
  this.request = null;

  /**
   * @type {?os.net.Request}
   * @protected
   */
  this.acRequest = null;
};
goog.inherits(os.search.AbstractUrlSearch, os.search.AbstractSearch);


/**
 * @param {string} term
 * @param {number=} opt_start
 * @param {number=} opt_pageSize
 * @return {?string} The search URL
 */
os.search.AbstractUrlSearch.prototype.getSearchUrl = function(term, opt_start, opt_pageSize) {
  return null;
};


/**
 * @param {string} term
 * @param {number=} opt_maxResults
 * @return {?string} The auto-complete URL
 */
os.search.AbstractUrlSearch.prototype.getAutoCompleteUrl = function(term, opt_maxResults) {
  return null;
};


/**
 * @inheritDoc
 */
os.search.AbstractUrlSearch.prototype.cancel = function() {
  if (this.request) {
    this.request.dispose();
    this.request = null;
  }

  if (this.acRequest) {
    this.acRequest.dispose();
    this.acRequest = null;
  }

  this.acResults.length = 0;
  this.results.length = 0;
};


/**
 * @inheritDoc
 */
os.search.AbstractUrlSearch.prototype.autocomplete = function(term, opt_maxResults) {
  this.cancel();
  this.term = term;

  // require a term for url searches
  if (term) {
    var request = this.getAutoCompleteRequest(term, opt_maxResults);
    if (request) {
      request.listenOnce(goog.net.EventType.SUCCESS, this.onAutoCompleteSuccess, false, this);
      request.listenOnce(goog.net.EventType.ERROR, this.onAutoCompleteError, false, this);
      request.load();
      this.acRequest = request;
      return;
    }
  }

  this.dispatchEvent(new os.search.SearchEvent(os.search.SearchEventType.AUTOCOMPLETED,
      this.term, this.acResults, this.acResults.length));
};


/**
 * @param {!string} term
 * @param {number=} opt_maxResults
 * @return {?os.net.Request}
 * @protected
 */
os.search.AbstractUrlSearch.prototype.getAutoCompleteRequest = function(term, opt_maxResults) {
  var request = null;
  var uri = this.getAutoCompleteUrl(term, opt_maxResults);

  if (uri) {
    request = new os.net.Request();
    request.setUri(uri);
    request.setHeader('Accept', 'application/json, text/plain, */*');
  }

  return request;
};


/**
 * @param {goog.events.Event} evt
 * @private
 */
os.search.AbstractUrlSearch.prototype.finishAutoComplete_ = function(evt) {
  var request = /** @type {os.net.Request} */ (evt.target);
  request.removeAllListeners();
  this.dispatchEvent(new os.search.SearchEvent(os.search.SearchEventType.AUTOCOMPLETED,
      this.term, this.acResults, this.acResults.length));
};


/**
 * @param {goog.events.Event} evt
 * @protected
 */
os.search.AbstractUrlSearch.prototype.onAutoCompleteSuccess = function(evt) {
  this.finishAutoComplete_(evt);
};


/**
 * @param {goog.events.Event} evt
 * @protected
 */
os.search.AbstractUrlSearch.prototype.onAutoCompleteError = function(evt) {
  this.finishAutoComplete_(evt);
};


/**
 * @inheritDoc
 */
os.search.AbstractUrlSearch.prototype.searchTerm = function(term, opt_start, opt_pageSize) {
  this.cancel();
  this.term = term;

  // require a term for url searches
  if (term) {
    var request = this.getSearchRequest(term, opt_start, opt_pageSize);
    if (request) {
      request.listenOnce(goog.net.EventType.SUCCESS, this.onSearchSuccess, false, this);
      request.listenOnce(goog.net.EventType.ERROR, this.onSearchError, false, this);
      request.load();
      this.request = request;
      return true;
    }
  }

  // if we get here, we're done
  this.dispatchEvent(new os.search.SearchEvent(os.search.SearchEventType.SUCCESS,
      this.term, this.results, this.results.length));
  return true;
};


/**
 * @param {?string} uri
 * @param {string} term
 * @return {?string}
 * @protected
 */
os.search.AbstractUrlSearch.prototype.replaceUri = function(uri, term) {
  if (uri && term) {
    term = encodeURIComponent(term);

    uri = uri.replace(/{s}/g, term);
    uri = uri.replace(/{l}/g, term.toLowerCase());
    uri = uri.replace(/{u}/g, term.toUpperCase());
  }

  return uri;
};


/**
 * @param {!string} term
 * @param {number=} opt_start
 * @param {number=} opt_pageSize
 * @return {?os.net.Request}
 * @protected
 */
os.search.AbstractUrlSearch.prototype.getSearchRequest = function(term, opt_start, opt_pageSize) {
  var request = null;
  var uri = this.replaceUri(this.getSearchUrl(/** @type {string} */ (term), opt_start, opt_pageSize), term);

  if (uri) {
    request = new os.net.Request();
    request.setUri(uri);
    request.setHeader('Accept', 'application/json, text/plain, */*');
  }

  return request;
};


/**
 * @param {goog.events.Event} evt
 * @private
 */
os.search.AbstractUrlSearch.prototype.finish_ = function(evt) {
  var request = /** @type {os.net.Request} */ (evt.target);
  request.removeAllListeners();
  this.dispatchEvent(new os.search.SearchEvent(os.search.SearchEventType.SUCCESS,
      this.term, this.results, this.results.length));
};


/**
 * @param {goog.events.Event} evt
 * @protected
 */
os.search.AbstractUrlSearch.prototype.onSearchSuccess = function(evt) {
  this.finish_(evt);
};


/**
 * @param {goog.events.Event} evt
 * @protected
 */
os.search.AbstractUrlSearch.prototype.onSearchError = function(evt) {
  this.finish_(evt);
};
