goog.provide('os.search.ProviderResults');
goog.provide('os.search.SearchManager');

goog.require('goog.array');
goog.require('goog.async.Deferred');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('goog.object');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.config');
goog.require('os.metrics.keys');
goog.require('os.search');
goog.require('os.search.AbstractSearchManager');
goog.require('os.search.Favorite');
goog.require('os.search.ISearch');
goog.require('os.search.ISearchResult');
goog.require('os.search.SearchEvent');
goog.require('os.search.SearchEventType');


/**
 * @typedef {{
 *   results: !Array<!os.search.ISearchResult>,
 *   total: number
 * }}
 */
os.search.ProviderResults;



/**
 * Responsible for executing search terms against the registered searches
 * @extends {os.search.AbstractSearchManager}
 * @param {string=} opt_id
 * @constructor
 */
os.search.SearchManager = function(opt_id) {
  os.search.SearchManager.base(this, 'constructor', opt_id);

  /**
   * @type {!Object<string, !os.search.ISearch>}
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
   * @type {!Object<string, os.search.ProviderResults>}
   * @protected
   */
  this.providerResults = {};

  /**
   * @type {!Array<!os.search.ISearchResult>}
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
};
goog.inherits(os.search.SearchManager, os.search.AbstractSearchManager);
goog.addSingletonGetter(os.search.SearchManager);


/**
 * Logger for os.search.SearchManager
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.search.SearchManager.LOGGER_ = goog.log.getLogger('os.search.SearchManager');


/**
 * @type {string}
 * @const
 */
os.search.SearchManager.SEARCH_ALL = 'Search All Sources';


/**
 * Gets a search by its identifier.
 * @param {string} id The search identifier
 * @return {?os.search.ISearch}
 */
os.search.SearchManager.prototype.getSearch = function(id) {
  return this.registeredSearches_[id] || null;
};


/**
 * Register a search implementation.
 * If no search is selected yet, assigns this search as selected.
 * @param {os.search.ISearch} search The search implementation
 */
os.search.SearchManager.prototype.registerSearch = function(search) {
  if (search) {
    var existing = this.getSearch(search.getId());
    if (!existing) {
      // register the new search
      this.registeredSearches_[search.getId()] = search;

      // attach listeners
      search.listen(os.search.SearchEventType.SUCCESS, this.handleSearchSuccess_, false, this);
      search.listen(os.search.SearchEventType.ERROR, this.handleSearchError_, false, this);
      search.listen(os.search.SearchEventType.AUTOCOMPLETED, this.handleAutocompleteSuccess_, false, this);
      search.listen(os.search.SearchEventType.AUTOCOMPLETEFAIL, this.handleAutocompleteFailure_, false, this);

      this.dispatchEvent(goog.events.EventType.CHANGE);
    } else {
      // don't allow registering searches with duplicate id's
      goog.log.error(os.search.SearchManager.LOGGER_, 'Search provider already registered with id "' +
          existing.getId() + '". Existing name is "' + existing.getName() + '", new name is "' + search.getName() +
          '".');
    }
  }
};


/**
 * @inheritDoc
 */
os.search.SearchManager.prototype.getRegisteredSearches = function(opt_excludeExternal) {
  return goog.object.getValues(this.registeredSearches_).filter(function(search) {
    return (!opt_excludeExternal || !search.isExternal());
  });
};


/**
 * @inheritDoc
 */
os.search.SearchManager.prototype.getEnabledSearches = function(opt_term) {
  var searches = this.getRegisteredSearches();
  var term = opt_term;
  return searches.filter(function(search) {
    if (term) {
      return (search.isEnabled() && search.supportsSearchTerm(term));
    } else {
      return search.isEnabled();
    }
  });
};


/**
 * @inheritDoc
 */
os.search.SearchManager.prototype.search = function(term, opt_start, opt_pageSize,
    opt_sortBy, opt_force, opt_noFacets, opt_sortOrder) {
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

      this.dispatchEvent(new os.search.SearchEvent(os.search.SearchEventType.START, this.getTerm(), [], 0));

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
        os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Search.SEARCH_TYPE + '.' + enabled[i].type, 1);
      }

      // do search
      for (var i = 0, n = enabled.length; i < n; i++) {
        enabled[i].search(term, opt_start, opt_pageSize, opt_sortBy, opt_noFacets, opt_sortOrder);
      }
    } else {
      // nothing enabled - can't search! tell the user why.
      var numSearches = goog.object.getCount(this.registeredSearches_);
      if (numSearches == 0) {
        // we didn't register any searches
        var contact = os.config.getSupportContact();
        var support = contact !== undefined ? ('<b>' + contact + '</b>') : 'an administrator';
        var message = 'No search types are available. Please ensure you have appropriate permissions or contact ' +
            support + ' for support.';
        os.alert.AlertManager.getInstance().sendAlert(message, os.alert.AlertEventSeverity.ERROR);
      } else {
        // they turned off all the searches
        var message = 'No search types are enabled that support requested search.' +
            ' Please enable at least one type in the search menu.';
        os.alert.AlertManager.getInstance().sendAlert(message, os.alert.AlertEventSeverity.WARNING);
      }
    }
  } else {
    this.clear();
  }
};


/**
 * Generate a search key for search results
 * @param {os.search.ISearch} search
 * @return {string}
 */
os.search.SearchManager.prototype.getSearchKey = function(search) {
  return search.getName() + '_' + search.getType();
};


/**
 * Handle search success event for a single search provider.
 * @param {os.search.SearchEvent} event
 * @private
 */
os.search.SearchManager.prototype.handleSearchSuccess_ = function(event) {
  var search = /** @type {os.search.ISearch} */ (event.target);
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
  goog.object.forEach(this.providerResults, function(pr) {
    this.results = this.results.concat(pr['results']);
    this.total_ += pr['total'];
  }, this);

  // A search can be started by a provider, make sure the terms match.
  if (this.getTerm() !== event.getSearchTerm()) {
    this.setTerm(event.getSearchTerm() || '');
  }
  this.sortResults();
  this.dispatch();
};


/**
 * Sort results
 * @protected
 */
os.search.SearchManager.prototype.sortResults = function() {
  // sort results in order of descending score
  goog.array.sort(this.results, this.scoreCompare);
};


/**
 * @param {os.search.SearchEvent} event
 * @private
 */
os.search.SearchManager.prototype.handleSearchError_ = function(event) {
  var search = /** @type {os.search.ISearch} */ (event.target);
  delete this.loading_[search.getId()];
  this.dispatch();
};


/**
 * Dispatches a progress or success event
 */
os.search.SearchManager.prototype.dispatch = function() {
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
  var type = os.search.SearchEventType.SUCCESS;

  if (!goog.object.isEmpty(this.loading_)) {
    type = os.search.SearchEventType.PROGRESS;
  }

  this.dispatchEvent(new os.search.SearchEvent(type, this.getTerm(), this.results, this.total_));
};


/**
 * @inheritDoc
 */
os.search.SearchManager.prototype.checkProgress = function() {
  this.dispatch();
};


/**
 * @param {os.search.ISearch} search
 * @return {os.search.ProviderResults}
 */
os.search.SearchManager.prototype.getProviderResults = function(search) {
  return this.providerResults[this.getSearchKey(search)];
};


/**
 * @inheritDoc
 */
os.search.SearchManager.prototype.autocomplete = function(term, opt_maxResults) {
  this.setTerm(term);
  this.acResults_ = [];

  var enabled = this.getEnabledSearches(term);
  for (var i = 0, n = enabled.length; i < n; i++) {
    enabled[i].autocomplete(term, opt_maxResults);
  }
};


/**
 * Handle autocomplete success event for a single search provider.
 * @param {os.search.SearchEvent} event
 * @private
 */
os.search.SearchManager.prototype.handleAutocompleteSuccess_ = function(event) {
  var results = event.getResults();
  if (results) {
    this.acResults_ = this.acResults_.concat(results);
  }

  this.dispatchEvent(new os.search.SearchEvent(os.search.SearchEventType.AUTOCOMPLETED,
      this.getTerm(), this.acResults_));
};


/**
 * Handle autocomplete failure event for a single search provider.
 * @param {os.search.SearchEvent} event
 * @private
 */
os.search.SearchManager.prototype.handleAutocompleteFailure_ = function(event) {
  this.dispatchEvent(new goog.events.Event(os.search.SearchEventType.AUTOCOMPLETEFAIL));
};


/**
 * @inheritDoc
 */
os.search.SearchManager.prototype.clear = function(opt_term) {
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
  this.dispatchEvent(new os.search.SearchEvent(os.search.SearchEventType.SUCCESS, this.getTerm(), this.results, 0));
};


/**
 * @inheritDoc
 */
os.search.SearchManager.prototype.getResults = function(opt_limit) {
  var results = goog.array.clone(this.results);
  return opt_limit ? goog.array.slice(results, 0, opt_limit) : results;
};


/**
 * Get count of results
 * @param {number=} opt_limit
 * @return {number}
 * @export
 */
os.search.SearchManager.prototype.getResultsCount = function(opt_limit) {
  return opt_limit ? Math.min(this.results.length, opt_limit) : this.results.length;
};


/**
 * @inheritDoc
 * @export
 */
os.search.SearchManager.prototype.getTotal = function() {
  return this.total_;
};


/**
 * @return {boolean}
 * @export
 */
os.search.SearchManager.prototype.isFederated = function() {
  return !this.getRegisteredSearches(true).length;
};


/**
 * Normalizes the scores within the results
 * @param {Array<os.search.ISearchResult>} results
 * @protected
 */
os.search.SearchManager.prototype.normalizeResults = function(results) {
  if (results.length) {
    // Check to see if all the scores are the same
    var score = results[0].getScore();
    var sameScore = goog.array.every(results, function(result) {
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
};


/**
 * @inheritDoc
 */
os.search.SearchManager.prototype.getLoading = function() {
  return goog.object.clone(this.loading_);
};


/**
 * @inheritDoc
 * @export
 */
os.search.SearchManager.prototype.isLoading = function() {
  return !goog.object.isEmpty(this.loading_);
};


/**
 * Global search manager reference.
 * @type {!os.search.SearchManager}
 */
os.searchManager = os.search.SearchManager.getInstance();
