goog.declareModuleId('os.search.AbstractUrlSearch');

import Request from '../net/request.js';
import AbstractSearch from './abstractsearch.js';
import SearchEvent from './searchevent.js';
import SearchEventType from './searcheventtype.js';

const EventType = goog.require('goog.net.EventType');

const GoogEvent = goog.requireType('goog.events.Event');
const {default: ISearchResult} = goog.requireType('os.search.ISearchResult');


/**
 * @abstract
 */
export default class AbstractUrlSearch extends AbstractSearch {
  /**
   * Constructor.
   * @param {string} id The unique identifier for the search provider.
   * @param {string} name The user-facing name of the search provider.
   */
  constructor(id, name) {
    super(id, name);

    /**
     * @type {Array<ISearchResult>}
     * @protected
     */
    this.results = [];

    /**
     * @type {Array}
     * @protected
     */
    this.acResults = [];

    /**
     * @type {?Request}
     * @protected
     */
    this.request = null;

    /**
     * @type {?Request}
     * @protected
     */
    this.acRequest = null;

    /**
     * @type {?string}
     * @protected
     */
    this.sortBy = null;

    /**
     * @type {?string}
     * @protected
     */
    this.sortOrder = null;
  }

  /**
   * @abstract
   * @param {string} term
   * @param {number=} opt_start
   * @param {number=} opt_pageSize
   * @return {?string} The search URL
   */
  getSearchUrl(term, opt_start, opt_pageSize) {}

  /**
   * @param {string} term
   * @param {number=} opt_maxResults
   * @return {?string} The auto-complete URL
   */
  getAutoCompleteUrl(term, opt_maxResults) {
    return null;
  }

  /**
   * @inheritDoc
   */
  cancel() {
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
  }

  /**
   * @inheritDoc
   */
  autocomplete(term, opt_maxResults) {
    this.cancel();
    this.term = term;

    // require a term for url searches
    if (term) {
      var request = this.getAutoCompleteRequest(term, opt_maxResults);
      if (request) {
        request.listenOnce(EventType.SUCCESS, this.onAutoCompleteSuccess, false, this);
        request.listenOnce(EventType.ERROR, this.onAutoCompleteError, false, this);
        request.load();
        this.acRequest = request;
        return;
      }
    }

    this.dispatchEvent(new SearchEvent(SearchEventType.AUTOCOMPLETED,
        this.term, this.acResults, this.acResults.length));
  }

  /**
   * @param {!string} term
   * @param {number=} opt_maxResults
   * @return {?Request}
   * @protected
   */
  getAutoCompleteRequest(term, opt_maxResults) {
    var request = null;
    var uri = this.getAutoCompleteUrl(term, opt_maxResults);

    if (uri) {
      request = new Request();
      request.setUri(uri);
      request.setHeader('Accept', 'application/json, text/plain, */*');
    }

    return request;
  }

  /**
   * @param {GoogEvent} evt
   * @private
   */
  finishAutoComplete_(evt) {
    var request = /** @type {Request} */ (evt.target);
    request.removeAllListeners();
    this.dispatchEvent(new SearchEvent(SearchEventType.AUTOCOMPLETED,
        this.term, this.acResults, this.acResults.length));
  }

  /**
   * @param {GoogEvent} evt
   * @protected
   */
  onAutoCompleteSuccess(evt) {
    this.finishAutoComplete_(evt);
  }

  /**
   * @param {GoogEvent} evt
   * @protected
   */
  onAutoCompleteError(evt) {
    this.finishAutoComplete_(evt);
  }

  /**
   * @inheritDoc
   */
  searchTerm(term, opt_start, opt_pageSize, opt_sortBy, opt_noFacets, opt_sortOrder) {
    this.cancel();
    this.term = term;
    this.sortBy = opt_sortBy;
    this.sortOrder = opt_sortOrder;

    // require a term for url searches
    if (term) {
      var request = this.getSearchRequest(term, opt_start, opt_pageSize);
      if (request) {
        request.listenOnce(EventType.SUCCESS, this.onSearchSuccess, false, this);
        request.listenOnce(EventType.ERROR, this.onSearchError, false, this);
        request.load();
        this.request = request;
        return true;
      }
    }

    // if we get here, we're done
    this.dispatchEvent(new SearchEvent(SearchEventType.SUCCESS,
        this.term, this.results, this.results.length));
    return true;
  }

  /**
   * @param {?string} uri
   * @param {string} term
   * @return {?string}
   * @protected
   */
  replaceUri(uri, term) {
    if (uri && term) {
      term = encodeURIComponent(term);

      uri = uri.replace(/{s}/g, term);
      uri = uri.replace(/{l}/g, term.toLowerCase());
      uri = uri.replace(/{u}/g, term.toUpperCase());
    }

    return uri;
  }

  /**
   * @param {!string} term
   * @param {number=} opt_start
   * @param {number=} opt_pageSize
   * @return {?Request}
   * @protected
   */
  getSearchRequest(term, opt_start, opt_pageSize) {
    var request = null;
    var uri = this.replaceUri(this.getSearchUrl(/** @type {string} */ (term), opt_start, opt_pageSize), term);

    if (uri) {
      request = new Request();
      request.setUri(uri);
      request.setHeader('Accept', 'application/json, text/plain, */*');
    }

    return request;
  }

  /**
   * @param {GoogEvent} evt
   * @private
   */
  finish_(evt) {
    var request = /** @type {Request} */ (evt.target);
    request.removeAllListeners();
    this.dispatchEvent(new SearchEvent(SearchEventType.SUCCESS,
        this.term, this.results, this.results.length));
  }

  /**
   * @param {GoogEvent} evt
   * @protected
   */
  onSearchSuccess(evt) {
    this.finish_(evt);
  }

  /**
   * @param {GoogEvent} evt
   * @protected
   */
  onSearchError(evt) {
    this.finish_(evt);
  }
}
