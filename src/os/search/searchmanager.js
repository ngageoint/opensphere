goog.declareModuleId('os.search.SearchManager');

import AlertEventSeverity from '../alert/alerteventseverity.js';
import AlertManager from '../alert/alertmanager.js';
import {getSupportContact} from '../config/config.js';
import Metrics from '../metrics/metrics.js';
import {Search as SearchKeys} from '../metrics/metricskeys.js';
import AbstractSearchManager from './abstractsearchmanager.js';
import SearchEvent from './searchevent.js';
import SearchEventType from './searcheventtype.js';

const GoogEvent = goog.require('goog.events.Event');
const GoogEventType = goog.require('goog.events.EventType');
const log = goog.require('goog.log');
const googObject = goog.require('goog.object');

const {default: ISearch} = goog.requireType('os.search.ISearch');
const {default: ISearchResult} = goog.requireType('os.search.ISearchResult');
const {default: ProviderResults} = goog.requireType('os.search.ProviderResults');


/**
 * Responsible for executing search terms against the registered searches
 */
export default class SearchManager extends AbstractSearchManager {
  /**
   * Constructor.
   * @param {string=} opt_id
   */
  constructor(opt_id) {
    super(opt_id);

    /**
     * @type {!Object<string, !ISearch>}
     * @private
     */
    this.registeredSearches_ = {};

    /**
     * @type {!Array<*>}
     * @private
     */
    this.acResults_ = [];

    /**
     * Track where the results come from. Each provider can only provide 1 set of results
     * @type {!Object<string, ProviderResults>}
     * @protected
     */
    this.providerResults = {};

    /**
     * @type {!Array<!ISearchResult>}
     * @protected
     */
    this.results = [];

    /**
     * @type {!Object<string, boolean>}
     * @private
     */
    this.loading_ = {};

    /**
     * @type {number}
     * @private
     */
    this.total_ = 0;
  }

  /**
   * Gets a search by its identifier.
   *
   * @param {string} id The search identifier
   * @return {?ISearch}
   */
  getSearch(id) {
    return this.registeredSearches_[id] || null;
  }

  /**
   * Register a search implementation.
   * If no search is selected yet, assigns this search as selected.
   *
   * @param {ISearch} search The search implementation
   */
  registerSearch(search) {
    if (search) {
      var existing = this.getSearch(search.getId());
      if (!existing) {
        // register the new search
        this.registeredSearches_[search.getId()] = search;

        // attach listeners
        search.listen(SearchEventType.SUCCESS, this.handleSearchSuccess_, false, this);
        search.listen(SearchEventType.ERROR, this.handleSearchError, false, this);
        search.listen(SearchEventType.AUTOCOMPLETED, this.handleAutocompleteSuccess_, false, this);
        search.listen(SearchEventType.AUTOCOMPLETEFAIL, this.handleAutocompleteFailure_, false, this);

        this.dispatchEvent(GoogEventType.CHANGE);
      } else {
        // don't allow registering searches with duplicate id's
        log.error(logger, 'Search provider already registered with id "' +
            existing.getId() + '". Existing name is "' + existing.getName() + '", new name is "' + search.getName() +
            '".');
      }
    }
  }

  /**
   * @inheritDoc
   */
  getRegisteredSearches(opt_excludeExternal) {
    return Object.values(this.registeredSearches_).filter(function(search) {
      return (!opt_excludeExternal || !search.isExternal());
    });
  }

  /**
   * @inheritDoc
   */
  getEnabledSearches(opt_term) {
    var searches = this.getRegisteredSearches();
    var term = opt_term;
    return searches.filter(function(search) {
      if (term) {
        return (search.isEnabled() && search.supportsSearchTerm(term));
      } else {
        return search.isEnabled();
      }
    });
  }

  /**
   * @inheritDoc
   */
  search(term, opt_start, opt_pageSize, opt_sortBy, opt_force, opt_noFacets, opt_sortOrder) {
    this.setTerm(term);
    this.providerResults = {};
    this.results = [];
    this.total_ = 0;
    this.setSort(opt_sortBy || '');

    // don't bother searching if the term is empty or page size is 0
    if ((term || opt_force) && opt_pageSize !== 0) {
      var enabled = this.getEnabledSearches(term);
      if (enabled.length > 0) {
        // TODO: should we dedupe by search type/priority??

        this.dispatchEvent(new SearchEvent(SearchEventType.START, this.getTerm(), [], 0));

        // cancel any searches that are currently loading
        for (var id in this.loading_) {
          if (this.loading_[id] && this.registeredSearches_[id]) {
            this.registeredSearches_[id].cancel();
          }
        }

        // prep loading list
        this.loading_ = {};
        // Keep track of all the loading searches. This is broken into 2 loops because search can be sync
        for (var i = 0, n = enabled.length; i < n; i++) {
          this.loading_[enabled[i].getId()] = true;
          Metrics.getInstance().updateMetric(SearchKeys.SEARCH_TYPE + '.' + enabled[i].getType(), 1);
        }

        // do search
        for (var i = 0, n = enabled.length; i < n; i++) {
          enabled[i].search(term, opt_start, opt_pageSize, opt_sortBy, opt_noFacets, opt_sortOrder);
        }
      } else {
        // nothing enabled - can't search! tell the user why.
        var numSearches = googObject.getCount(this.registeredSearches_);
        if (numSearches == 0) {
          // we didn't register any searches
          var contact = getSupportContact();
          var support = contact !== undefined ? ('<b>' + contact + '</b>') : 'an administrator';
          var message = 'No search types are available. Please ensure you have appropriate permissions or contact ' +
              support + ' for support.';
          AlertManager.getInstance().sendAlert(message, AlertEventSeverity.ERROR);
        } else {
          // they turned off all the searches
          var message = 'No search types are enabled that support requested search.' +
              ' Please enable at least one type in the search menu.';
          AlertManager.getInstance().sendAlert(message, AlertEventSeverity.WARNING);
        }
      }
    } else {
      this.clear();
    }
  }

  /**
   * Generate a search key for search results
   *
   * @param {ISearch} search
   * @return {string}
   */
  getSearchKey(search) {
    return search.getName() + '_' + search.getType();
  }

  /**
   * Handle search success event for a single search provider.
   *
   * @param {SearchEvent} event
   * @private
   */
  handleSearchSuccess_(event) {
    var search = /** @type {ISearch} */ (event.target);
    delete this.loading_[search.getId()];

    var results = event.getResults() || [];
    if (search.shouldNormalize()) {
      this.normalizeResults(results);
    }

    this.providerResults[this.getSearchKey(search)] = {
      'results': results,
      'total': event.getTotal()
    };

    // Create the results from each provider
    this.results = [];
    this.total_ = 0;
    googObject.forEach(this.providerResults, (pr) => {
      this.results = this.results.concat(pr['results']);
      this.total_ += pr['total'];
    });

    // A search can be started by a provider, make sure the terms match.
    if (this.getTerm() !== event.getSearchTerm()) {
      this.setTerm(event.getSearchTerm() || '');
    }
    this.sortResults();
    this.dispatch();
  }

  /**
   * Sort results
   *
   * @protected
   */
  sortResults() {
    // sort results in order of descending score
    this.results.sort(this.scoreCompare);
  }

  /**
   * @param {SearchEvent} event
   * @protected
   */
  handleSearchError(event) {
    var search = /** @type {ISearch} */ (event.target);
    delete this.loading_[search.getId()];
    this.dispatch();
  }

  /**
   * Dispatches a progress or success event
   */
  dispatch() {
    // remove or display the "No Results" node as appropriate
    if (this.getNoResultClass()) {
      if (this.results.length === 0) {
        // add "No Results" result
        this.results.push(new (this.getNoResultClass())());
      } else if (this.results.length > 1) {
        // remove "No Results" result
        for (var i = 0, n = this.results.length; i < n; i++) {
          if (this.results[i] instanceof this.getNoResultClass()) {
            this.results.splice(i, 1);
            break;
          }
        }
      }
    }

    // if this is the last one, use SUCCESS. Otherwise use PROGRESS
    var type = SearchEventType.SUCCESS;

    if (!googObject.isEmpty(this.loading_)) {
      type = SearchEventType.PROGRESS;
    }

    this.dispatchEvent(new SearchEvent(type, this.getTerm(), this.results, this.total_));
  }

  /**
   * @inheritDoc
   */
  checkProgress() {
    this.dispatch();
  }

  /**
   * @param {ISearch} search
   * @return {ProviderResults}
   */
  getProviderResults(search) {
    return this.providerResults[this.getSearchKey(search)];
  }

  /**
   * @inheritDoc
   */
  autocomplete(term, opt_maxResults) {
    this.setTerm(term);
    this.acResults_ = [];

    var enabled = this.getEnabledSearches(term);
    for (var i = 0, n = enabled.length; i < n; i++) {
      enabled[i].autocomplete(term, opt_maxResults);
    }
  }

  /**
   * Handle autocomplete success event for a single search provider.
   *
   * @param {SearchEvent} event
   * @private
   */
  handleAutocompleteSuccess_(event) {
    var results = event.getResults();
    if (results) {
      this.acResults_ = this.acResults_.concat(results);
    }

    this.dispatchEvent(new SearchEvent(SearchEventType.AUTOCOMPLETED,
        this.getTerm(), this.acResults_));
  }

  /**
   * Handle autocomplete failure event for a single search provider.
   *
   * @param {SearchEvent} event
   * @private
   */
  handleAutocompleteFailure_(event) {
    this.dispatchEvent(new GoogEvent(SearchEventType.AUTOCOMPLETEFAIL));
  }

  /**
   * @inheritDoc
   */
  clear(opt_term) {
    this.setTerm(opt_term || '');

    this.providerResults = {};
    this.results = [];
    this.total_ = 0;
    this.setSort('');

    // cancel anything that may be still pending
    for (var key in this.registeredSearches_) {
      this.registeredSearches_[key].cancel();
    }

    this.loading_ = {};
    this.dispatchEvent(new SearchEvent(SearchEventType.SUCCESS, this.getTerm(), this.results, 0));
  }

  /**
   * @inheritDoc
   */
  getResults(opt_limit) {
    var results = this.results.slice();
    return opt_limit ? results.slice(0, opt_limit) : results;
  }

  /**
   * Get count of results
   *
   * @param {number=} opt_limit
   * @return {number}
   * @export
   */
  getResultsCount(opt_limit) {
    return opt_limit ? Math.min(this.results.length, opt_limit) : this.results.length;
  }

  /**
   * @inheritDoc
   * @export
   */
  getTotal() {
    return this.total_;
  }

  /**
   * @return {boolean}
   * @export
   */
  isFederated() {
    return !this.getRegisteredSearches(true).length;
  }

  /**
   * Normalizes the scores within the results
   *
   * @param {Array<ISearchResult>} results
   * @protected
   */
  normalizeResults(results) {
    if (results.length) {
      // Check to see if all the scores are the same
      var score = results[0].getScore();
      var sameScore = results.every(function(result) {
        return score == result.getScore();
      });

      if (sameScore) {
        // If all the scores are the same, we dont have any score info. Spread out the scores
        results.forEach(function(result, index) {
          result.setScore((index + 1) / results.length * 100);
        });
      } else {
        // Get the max score
        var max = Number.NEGATIVE_INFINITY;
        results.forEach(function(result) {
          max = max < result.getScore() ? result.getScore() : max;
        });

        // Normalize according to the max value
        results.forEach(function(result) {
          result.setScore(result.getScore() / (max / 100));
        });
      }
    }
  }

  /**
   * @inheritDoc
   */
  getLoading() {
    return googObject.clone(this.loading_);
  }

  /**
   * @inheritDoc
   * @export
   */
  isLoading() {
    return !googObject.isEmpty(this.loading_);
  }

  /**
   * Get the global instance.
   * @return {!SearchManager}
   */
  static getInstance() {
    if (!instance) {
      instance = new SearchManager();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {SearchManager} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {SearchManager|undefined}
 */
let instance;

/**
 * Logger for SearchManager
 * @type {log.Logger}
 */
const logger = log.getLogger('os.search.SearchManager');

/**
 * @type {string}
 * @const
 */
SearchManager.SEARCH_ALL = 'Search All Sources';
