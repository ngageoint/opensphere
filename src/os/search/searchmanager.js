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
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.search.SearchManager = function() {
  os.search.SearchManager.base(this, 'constructor');

  /**
   * @type {string}
   * @private
   */
  this.term_ = '';

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
   * @private
   */
  this.providerResults_ = {};

  /**
   * @type {!Array<!os.search.ISearchResult>}
   * @private
   */
  this.results_ = [];

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

  /**
   * @type {string}
   * @private
   */
  this.sortBy_ = '';

  /**
   * @type {?Function}
   * @private
   */
  this.noResultClass_ = null;

  /**
   * Function to filter out favorites
   * @type {function (Array<os.user.settings.favorite>): Array<os.search.Favorite>}
   */
  this.filterFavorites_ = this.defaultFilterFavorites_;
};
goog.inherits(os.search.SearchManager, goog.events.EventTarget);
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
 * @param {Function} noResultClass
 */
os.search.SearchManager.prototype.setNoResultClass = function(noResultClass) {
  this.noResultClass_ = noResultClass;
};


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
 * Retrieve the identifying names of all the registered searches.
 * @return {!Array<!os.search.ISearch>}
 */
os.search.SearchManager.prototype.getRegisteredSearches = function() {
  return goog.object.getValues(this.registeredSearches_);
};


/**
 * Get the search providers that are currently enabled, and
 * optionally support the search term.
 * @param {string=} opt_term
 * @return {!Array<!os.search.ISearch>}
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
 * Gets the last term.
 * @return {string}
 */
os.search.SearchManager.prototype.getTerm = function() {
  return this.term_;
};


/**
 * Gets the sort term.
 * @return {string}
 */
os.search.SearchManager.prototype.getSort = function() {
  return this.sortBy_;
};


/**
 * Execute search using registered searches.
 * @param {string} term The keyword search term
 * @param {number=} opt_start The index of the search results page
 * @param {number=} opt_pageSize The number of results to include per page
 * @param {string=} opt_sortBy The sort by string
 * @param {boolean=} opt_force Force a search
 * @param {boolean=} opt_noFacets flag for indicating facet search is not needed
 * @param {string=} opt_sortOrder The sort order
 */
os.search.SearchManager.prototype.search = function(term, opt_start, opt_pageSize,
    opt_sortBy, opt_force, opt_noFacets, opt_sortOrder) {
  this.term_ = term;
  this.providerResults_ = {};
  this.results_ = [];
  this.total_ = 0;
  this.sortBy_ = opt_sortBy || '';

  // don't bother searching if the term is empty or page size is 0
  if ((term || opt_force) && opt_pageSize !== 0) {
    var enabled = this.getEnabledSearches(term);
    if (enabled.length > 0) {
      // TODO: should we dedupe by search type/priority??

      this.dispatchEvent(new os.search.SearchEvent(os.search.SearchEventType.START, this.term_, [], 0));

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
        var support = goog.isDef(contact) ? ('<b>' + contact + '</b>') : 'an administrator';
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
 * Handle search success event for a single search provider.
 * @param {os.search.SearchEvent} event
 * @private
 */
os.search.SearchManager.prototype.handleSearchSuccess_ = function(event) {
  var search = /** @type {os.search.ISearch} */ (event.target);
  delete this.loading_[search.getId()];

  var results = event.getResults() || [];
  if (search.shouldNormalize()) {
    this.normalizeResults_(results);
  }

  this.providerResults_[search.getName() + '_' + search.getType()] = {
    'results': results,
    'total': event.getTotal()
  };

  // Create the results from each provider
  this.results_ = [];
  this.total_ = 0;
  goog.object.forEach(this.providerResults_, function(pr) {
    this.results_ = this.results_.concat(pr['results']);
    this.total_ += pr['total'];
  }, this);

  // A search can be started by a provider, make sure the terms match.
  if (this.term_ !== event.getSearchTerm()) {
    this.term_ = event.getSearchTerm() || '';
  }

  // sort results in order of descending score
  goog.array.sort(this.results_, this.scoreCompare_);

  this.dispatch_();
};


/**
 * @param {os.search.SearchEvent} event
 * @private
 */
os.search.SearchManager.prototype.handleSearchError_ = function(event) {
  var search = /** @type {os.search.ISearch} */ (event.target);
  delete this.loading_[search.getId()];
  this.dispatch_();
};


/**
 * Dispatches a progress or success event
 * @private
 */
os.search.SearchManager.prototype.dispatch_ = function() {
  // remove or display the "No Results" node as appropriate
  if (this.noResultClass_) {
    if (this.results_.length === 0) {
      // add "No Results" result
      this.results_.push(new this.noResultClass_());
    } else if (this.results_.length > 1) {
      // remove "No Results" result
      for (var i = 0, n = this.results_.length; i < n; i++) {
        if (this.results_[i] instanceof this.noResultClass_) {
          this.results_.splice(i, 1);
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

  this.dispatchEvent(new os.search.SearchEvent(type, this.term_, this.results_, this.total_));
};


/**
 * Force events to fire indicating whether there is a search in progress.
 */
os.search.SearchManager.prototype.checkProgress = function() {
  this.dispatch_();
};


/**
 * Requests autocomplete results from a search term.
 * @param {string} term The keyword to use in the search
 * @param {number=} opt_maxResults The maximum number of autocomplete results.
 */
os.search.SearchManager.prototype.autocomplete = function(term, opt_maxResults) {
  this.term_ = term;
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

  this.dispatchEvent(new os.search.SearchEvent(os.search.SearchEventType.AUTOCOMPLETED, this.term_, this.acResults_));
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
 * Clear the search results.
 * @param {string=} opt_term A default search term. If not provided, the term will be cleared.
 */
os.search.SearchManager.prototype.clear = function(opt_term) {
  this.term_ = opt_term || '';

  this.providerResults_ = {};
  this.results_ = [];
  this.total_ = 0;
  this.sortBy_ = '';

  // cancel anything that may be still pending
  for (var key in this.registeredSearches_) {
    this.registeredSearches_[key].cancel();
  }

  this.loading_ = {};
  this.dispatchEvent(new os.search.SearchEvent(os.search.SearchEventType.SUCCESS, this.term_, this.results_, 0));
};


/**
 * Retrieve search results as they have been captured be all searches
 * @return {Array} A shallow copy of the search results
 */
os.search.SearchManager.prototype.getResults = function() {
  return goog.array.clone(this.results_);
};


/**
 * Retrieve the total number of search results
 * @return {number}
 */
os.search.SearchManager.prototype.getTotal = function() {
  return this.total_;
};


/**
 * Normalizes the scores within the results
 * @param {Array<os.search.ISearchResult>} results
 * @private
 */
os.search.SearchManager.prototype.normalizeResults_ = function(results) {
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
 * Compares two search results by their score, for sorting in descending order.
 * @param {os.search.ISearchResult} a First result
 * @param {os.search.ISearchResult} b Second result
 * @return {number}
 * @private
 */
os.search.SearchManager.prototype.scoreCompare_ = function(a, b) {
  // default is ascending order, so flip the sign
  return -goog.array.defaultCompare(a.getScore(), b.getScore());
};


/**
 * Gets favorite searches
 * @param {number} max max number of reusltes to return.
 * @return {Array<os.search.Favorite>} array of favorite items
 */
os.search.SearchManager.prototype.getFavorites = function(max) {
  var favorites = [];
  if (this.filterFavorites_) {
    favorites = this.filterFavorites_(os.favoriteManager.filter(os.favoriteManager.getFavorites(),
        [os.user.settings.FavoriteType.SEARCH], max));
  }

  return favorites;
};


/**
 * gets the providers still loading.
 * @return {!Object<string, boolean>} object of loading providers
 */
os.search.SearchManager.prototype.getLoading = function() {
  return goog.object.clone(this.loading_);
};


/**
 * Filter favorites to only enabled providers
 * @param {Array<os.user.settings.favorite>} favorites
 * @return {Array<os.search.Favorite>}
 * @private
 */
os.search.SearchManager.prototype.defaultFilterFavorites_ = function(favorites) {
  return [];
};


/**
 * register the filter favorites function
 * @param {function (Array<os.user.settings.favorite>): Array<os.search.Favorite>} fn
 */
os.search.SearchManager.prototype.registerFilterFavoritesFn_ = function(fn) {
  this.filterFavorites_ = fn;
};


/**
 * Global search manager reference.
 * @type {!os.search.SearchManager}
 */
os.searchManager = os.search.SearchManager.getInstance();
