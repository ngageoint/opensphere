goog.provide('os.ui.search.SearchBoxCtrl');
goog.provide('os.ui.search.searchBoxDirective');

goog.require('goog.events.Event');
goog.require('os.alert.AlertManager');
goog.require('os.config.Settings');
goog.require('os.plugin.PluginManager');
goog.require('os.search');
goog.require('os.search.SearchEvent');
goog.require('os.search.SearchEventType');
goog.require('os.search.SearchManager');
goog.require('os.ui');
goog.require('os.ui.Module');
goog.require('os.ui.dragDropDirective');


/**
 * The search-box directive
 * @return {angular.Directive}
 */
os.ui.search.searchBoxDirective = function() {
  return {
    restrict: 'AE',
    scope: {
      'dataSource': '=datasource',
      'allowMultiple': '@',
      'eventPrefix': '@',
      'searchOnClear': '@',
      'showDropdownText': '@',
      'searchManager': '=?'
    },
    templateUrl: os.ROOT + 'views/search/searchbox.html',
    controller: os.ui.search.SearchBoxCtrl,
    controllerAs: 'searchBox'
  };
};


/**
 * Register the search-box directive.
 */
os.ui.Module.directive('searchBox', [os.ui.search.searchBoxDirective]);



/**
 * Controller function for the search-box directive.
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.search.SearchBoxCtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  /**
   * @type {boolean}
   * @private
   */
  this.searchOnClear_ = $scope['searchOnClear'] != 'false';

  /**
   * @type {?angular.JQLite}
   * @protected
   */
  this.element = $element;

  /**
   * @type {os.search.SearchManager}
   * @protected
   */
  this.searchManager = $scope['searchManager'] || os.search.SearchManager.getInstance();

  /**
   * The prefix to use for search events.
   * @type {string}
   * @protected
   */
  this.eventPrefix = $scope && $scope['eventPrefix'] || '';

  /**
   * @type {boolean}
   */
  this['allowMultiple'] = $scope['allowMultiple'] != 'false';

  /**
   * @type {boolean}
   */
  this['showDropdownText'] = $scope['showDropdownText'] == 'true';

  /**
   * @type {string}
   */
  this['searchTerm'] = this.searchManager.getTerm();

  /**
   * @type {boolean}
   */
  this['showSearchOptions'] = false;

  /**
   * @type {!Array<!os.search.ISearch>}
   */
  this['searchOptions'] = [];

  /**
   * @type {!Array<!osx.search.RecentSearch>}
   */
  this['recentSearches'] = /** @type {!Array<!osx.search.RecentSearch>} */ (os.settings.get(
      os.search.SearchSetting.RECENT, []));

  /**
   * @type {!jQuery}
   * @private
   */
  this.autocompleteSrc_ = /** @type {!jQuery} */ ($element.find('.search-query')).typeahead();
  goog.events.listen($element[0], 'click', this.onClick_, false, this);
  this.searchManager.listen(goog.events.EventType.CHANGE, this.onSearchManagerChange_, false, this);
  this.searchManager.listen(os.search.SearchEventType.START, this.onSearchStart_, false, this);
  this.searchManager.listen(os.search.SearchEventType.AUTOCOMPLETED, this.populateAutocomplete_, false, this);
  this.searchManager.listen(os.search.SearchEventType.SUCCESS, this.onSearchSuccess_, false, this);
  os.dispatcher.listen(os.search.SearchEventType.REFRESH, this.search, false, this);
  this.onSearchManagerChange_();

  /**
   * @type {!Array<string>}
   */
  this['providerGroups'] = [];

  /**
   * @type {!Object}
   */
  this['searchOptionsGroups'] = {};

  /**
   * @type {!Array<!os.search.ISearch>}
   */
  this['searchOptionsNoGroup'] = [];

  this.setUpGroups();

  // make sure the plugin manager is loaded before migrating recent searches, or they will not be migrated correctly.
  var pm = os.plugin.PluginManager.getInstance();
  if (pm.ready) {
    this.validateRecents_();
  } else {
    pm.listenOnce(goog.events.EventType.LOAD, this.validateRecents_, false, this);
  }

  this.onFavoritesUpdate_();
  os.settings.listen(os.user.settings.FavoriteManager.KEY, this.onFavoritesUpdate_, false, this);
  $scope.$on('$destroy', this.destroy.bind(this));
};


/**
 * Maximum number of search term/type pairs to remember.
 * @private
 * @const
 * @type {number}
 */
os.ui.search.SearchBoxCtrl.MAX_RECENT_ = 5;


/**
 * Clean up the controller.
 * @protected
 */
os.ui.search.SearchBoxCtrl.prototype.destroy = function() {
  goog.events.unlisten(this.element[0], 'click', this.onClick_, false, this);

  this.searchManager.unlisten(goog.events.EventType.CHANGE, this.onSearchManagerChange_, false, this);
  this.searchManager.unlisten(os.search.SearchEventType.START, this.onSearchStart_, false, this);
  this.searchManager.unlisten(os.search.SearchEventType.AUTOCOMPLETED, this.populateAutocomplete_, false, this);
  this.searchManager.unlisten(os.search.SearchEventType.SUCCESS, this.onSearchSuccess_, false, this);
  os.dispatcher.unlisten(os.search.SearchEventType.REFRESH, this.search, false, this);
  os.settings.unlisten(os.user.settings.FavoriteManager.KEY, this.onFavoritesUpdate_);

  this.element = null;
  this.scope = null;
};


/**
 * Validate recent searches. This both migrates the old format to the new, and verifies the search ids are registered.
 * This must be called after all search types have been registered with the application.
 * @private
 */
os.ui.search.SearchBoxCtrl.prototype.validateRecents_ = function() {
  var recents = /** @type {!Array<!osx.search.RecentSearch>} */ (this['recentSearches']);
  if (recents) {
    var updated = false;

    try {
      var searches = this.searchManager.getRegisteredSearches();
      var allIds = searches.map(os.search.getSearchId).sort();
      var i = recents.length;
      while (i--) {
        var recent = recents[i];
        if ('type' in recent) {
          //
          // This recent search is in the old format, so migrate it to the new one if possible.
          //

          var oldName = /** @type {string} */ (recent['type'] || '');
          updated = true;

          if (recent['type'] == os.search.SEARCH_ALL) {
            // assume the available providers haven't changed and enable all
            recent.ids = allIds;
          } else {
            var search = goog.array.find(searches, os.search.isNameEqual.bind(undefined, oldName));
            if (search) {
              // update to the new model
              recent.ids = [search.getId()];
            } else {
              // can't resolve the search provider - remove the recent search
              recents.splice(i, 1);
            }
          }

          // get rid of the old type key
          delete recent['type'];
        } else if (recent.ids) {
          //
          // This recent search is in the current format, so make sure the search id's are all registered.
          //

          var idCount = recent.ids.length;
          while (idCount--) {
            // if a recent search id isn't registered, remove that id
            if (!this.searchManager.getSearch(recent.ids[idCount])) {
              recent.ids.splice(idCount, 1);
              updated = true;
            }
          }

          // if no recognized ids are encountered, remove the recent search.
          if (recent.ids.length == 0) {
            recents.splice(i, 1);
            updated = true;
          }
        } else {
          // doesn't have either expected field
          recents.splice(i, 1);
          updated = true;
        }
      }
    } catch (e) {
      // this is a best effort migration, so if something fails just drop them
      this['recentSearches'] = [];
      updated = true;
    }

    if (updated) {
      this.saveRecent_();
    }
  }
};


/**
 * Handles click events, and if they came from the typeahead, execute a search.
 * @param {goog.events.BrowserEvent} event
 * @private
 */
os.ui.search.SearchBoxCtrl.prototype.onClick_ = function(event) {
  if (goog.dom.getAncestorByClass(event.target, 'typeahead')) {
    this.search();
  }
};


/**
 * Clear the search.
 */
os.ui.search.SearchBoxCtrl.prototype.clear = function() {
  this['searchTerm'] = '';
  this.search();
};
goog.exportProperty(os.ui.search.SearchBoxCtrl.prototype, 'clear', os.ui.search.SearchBoxCtrl.prototype.clear);


/**
 * Perform a search.
 */
os.ui.search.SearchBoxCtrl.prototype.search = function() {
  if (this['searchTerm'] || this.searchOnClear_) {
    if (this.scope['dataSource']) {
      var dataSource = /** @type {os.ui.search.SearchScrollDataSource} */ (this.scope['dataSource']);
      dataSource.setTerm(this.getSearchTerm_());
    } else {
      this.searchManager.search(this.getSearchTerm_());
    }

    os.ui.apply(this.scope);
  }
};
goog.exportProperty(os.ui.search.SearchBoxCtrl.prototype, 'search', os.ui.search.SearchBoxCtrl.prototype.search);


/**
 * Gets the search term
 * @return {string}
 * @private
 */
os.ui.search.SearchBoxCtrl.prototype.getSearchTerm_ = function() {
  return this['searchTerm'];
};


/**
 * Handles changes to the search manager.
 * @param {goog.events.Event=} opt_event
 * @private
 */
os.ui.search.SearchBoxCtrl.prototype.onSearchManagerChange_ = function(opt_event) {
  // update available options and the selection
  this['searchOptions'] = this.searchManager.getRegisteredSearches();
  this.setUpGroups();

  if (!this['allowMultiple']) {
    // if multiple providers aren't allowed, make sure only one is enabled
    var foundEnabled = false;
    this['searchOptions'].forEach(function(search) {
      if (search.isEnabled()) {
        if (foundEnabled) {
          search.setEnabled(false);
        } else {
          foundEnabled = true;
        }
      }
    });
  }

  if (this['searchTerm']) {
    this.search();
  }

  os.ui.apply(this.scope);
};


/**
 * Handle search start event.  Assign term to its most current value, keeps multiple searchbox instances in sync.
 * @param {os.search.SearchEvent} event
 * @private
 */
os.ui.search.SearchBoxCtrl.prototype.onSearchStart_ = function(event) {
  var term = event.getTerm();
  if (term !== this['searchTerm']) {
    this['searchTerm'] = term;
  }
  this.updateRecents();
};


/**
 * Make sure our search term stays in sync with the search manager
 * @param {os.search.SearchEvent} event
 * @private
 */
os.ui.search.SearchBoxCtrl.prototype.onSearchSuccess_ = function(event) {
  if (this['searchTerm'] != this.searchManager.getTerm()) {
    this['searchTerm'] = this.searchManager.getTerm();
  }
};


/**
 * Toggles a search on/off.
 * @param {!os.search.ISearch} search The search provider
 */
os.ui.search.SearchBoxCtrl.prototype.toggleSearch = function(search) {
  // always toggle if multiple types are available, otherwise only allow enabling a search. this prevents disabling all
  // search types in single mode.
  if (this['allowMultiple'] || !search.isEnabled()) {
    search.setEnabled(!search.isEnabled());
  }

  if (!this['allowMultiple'] && search.isEnabled()) {
    this['searchOptions'].forEach(function(next) {
      if (next != search && next.isEnabled()) {
        next.setEnabled(false);
      }
    });
  }
};
goog.exportProperty(
    os.ui.search.SearchBoxCtrl.prototype,
    'toggleSearch',
    os.ui.search.SearchBoxCtrl.prototype.toggleSearch);


/**
 * Toggles all searches on/off.
 * @param {boolean} value The new enabled value
 */
os.ui.search.SearchBoxCtrl.prototype.toggleAll = function(value) {
  this['searchOptions'].forEach(function(search) {
    search.setEnabled(value);
  });
};
goog.exportProperty(
    os.ui.search.SearchBoxCtrl.prototype,
    'toggleAll',
    os.ui.search.SearchBoxCtrl.prototype.toggleAll);


/**
 * Get the name of a search.
 * @param {!os.search.ISearch} search The search provider
 * @return {string}
 */
os.ui.search.SearchBoxCtrl.prototype.getSearchName = function(search) {
  return search.getName();
};
goog.exportProperty(
    os.ui.search.SearchBoxCtrl.prototype,
    'getSearchName',
    os.ui.search.SearchBoxCtrl.prototype.getSearchName);


/**
 * Get the name of a search.
 * @param {!os.search.ISearch} search The search provider
 * @return {string}
 */
os.ui.search.SearchBoxCtrl.prototype.getSearchIcon = function(search) {
  if (this['allowMultiple']) {
    return search.isEnabled() ? 'fa-check-square-o' : 'fa-square-o';
  } else if (search.isEnabled()) {
    return 'fa-angle-double-right';
  }

  return '';
};
goog.exportProperty(
    os.ui.search.SearchBoxCtrl.prototype,
    'getSearchIcon',
    os.ui.search.SearchBoxCtrl.prototype.getSearchIcon);


/**
 * Set up the grouped searches, along with the searches not in a group.
 */
os.ui.search.SearchBoxCtrl.prototype.setUpGroups = function() {
  this['providerGroups'] = [];
  this['searchOptionsGroups'] = {};
  this['searchOptionsNoGroup'] = [];

  var proGroups = /** @type {!Object<!Array<string>>} */ (os.settings.get('providerGroups', {}));
  var copiedOptions = goog.array.clone(this['searchOptions']);

  // Iterate over the Provider group names
  goog.object.forEach(proGroups, function(searchNameArray, groupName) {
    this['providerGroups'].push(groupName);

    var currentGroup = [];

    // Iterate over the searches under the provider group, and add the search to the group
    goog.array.forEach(searchNameArray, function(searchName) {
      var ind = goog.array.findIndex(copiedOptions, function(searchOption) {
        return searchName == searchOption.getName();
      }, this);
      if (ind > -1) {
        currentGroup.push(copiedOptions[ind]);
        goog.array.removeAt(copiedOptions, ind);
      }
    }, this);
    this['searchOptionsGroups'][groupName] = currentGroup;
  }, this);
  this['searchOptionsNoGroup'] = copiedOptions;
};


/**
 * Get the group icon
 * @param {string} group The group
 * @return {string}
 */
os.ui.search.SearchBoxCtrl.prototype.getGroupIcon = function(group) {
  if (this.allSearchesEnabled(group)) {
    return 'fa-check-square-o';
  } else if (this.allSearchesDisabled(group)) {
    return 'fa-square-o';
  }
  return 'fa-minus-square-o';
};
goog.exportProperty(
    os.ui.search.SearchBoxCtrl.prototype,
    'getGroupIcon',
    os.ui.search.SearchBoxCtrl.prototype.getGroupIcon);


/**
 * Get whether all searches in a group are enabled
 * @param {string} group The group
 * @return {boolean}
 */
os.ui.search.SearchBoxCtrl.prototype.allSearchesEnabled = function(group) {
  var searches = this['searchOptionsGroups'][group];
  var allEnabled = true;
  for (var i = 0; i < searches.length; i++) {
    if (!searches[i].isEnabled()) {
      allEnabled = false;
      break;
    }
  }
  return allEnabled;
};


/**
 * Get whether all searches in a group are disabled
 * @param {string} group The group
 * @return {boolean}
 */
os.ui.search.SearchBoxCtrl.prototype.allSearchesDisabled = function(group) {
  var searches = this['searchOptionsGroups'][group];
  var allDisabled = true;
  for (var i = 0; i < searches.length; i++) {
    if (searches[i].isEnabled()) {
      allDisabled = false;
      break;
    }
  }
  return allDisabled;
};


/**
 * Enable/disable all the searches in a group
 * @param {string} group The group
 */
os.ui.search.SearchBoxCtrl.prototype.toggleGroup = function(group) {
  var on = this.allSearchesEnabled(group);
  var searches = this['searchOptionsGroups'][group];
  for (var i = 0; i < searches.length; i++) {
    searches[i].setEnabled(!on);
  }
};
goog.exportProperty(
    os.ui.search.SearchBoxCtrl.prototype,
    'toggleGroup',
    os.ui.search.SearchBoxCtrl.prototype.toggleGroup);


/**
 * Get a searchOptionsGroup
 * @param {string} groupName The group name
 * @return {Array<os.search.ISearch>} The searches associated with groupName
 */
os.ui.search.SearchBoxCtrl.prototype.getSearchOptionsGroup = function(groupName) {
  return this['searchOptionsGroups'][groupName];
};
goog.exportProperty(
    os.ui.search.SearchBoxCtrl.prototype,
    'getSearchOptionsGroup',
    os.ui.search.SearchBoxCtrl.prototype.getSearchOptionsGroup);


/**
 * The name of the group that is completely and solely selected, otherwise an empty string
 * @return {?string} The name of the group that is completely selected, false otherwise
 */
os.ui.search.SearchBoxCtrl.prototype.singleGroupSelected = function() {
  if (this['providerGroups'].length == 0) {
    return null;
  }

  var numGroups = 0;
  var selectedGroup = '';

  var enabled = this['searchOptions'].filter(function(search) {
    return search.isEnabled();
  });

  for (var i = 0; i < this['providerGroups'].length; i++) {
    if (this.allSearchesEnabled(this['providerGroups'][i])) {
      numGroups += 1;
      selectedGroup = this['providerGroups'][i];
    }
  }
  if (numGroups == 1 && enabled.length == this['searchOptionsGroups'][selectedGroup].length) {
    return selectedGroup;
  }
  return null;
};


/**
 * If a search provider is enabled.
 * @param {!os.search.ISearch} search The search provider
 * @return {boolean}
 */
os.ui.search.SearchBoxCtrl.prototype.isSearchEnabled = function(search) {
  return search.isEnabled();
};
goog.exportProperty(
    os.ui.search.SearchBoxCtrl.prototype,
    'isSearchEnabled',
    os.ui.search.SearchBoxCtrl.prototype.isSearchEnabled);


/**
 * If at least one search provider is disabled.
 * @return {boolean}
 */
os.ui.search.SearchBoxCtrl.prototype.hasDisabledSearch = function() {
  return goog.array.some(this['searchOptions'], function(search) {
    return !search.isEnabled();
  });
};
goog.exportProperty(
    os.ui.search.SearchBoxCtrl.prototype,
    'hasDisabledSearch',
    os.ui.search.SearchBoxCtrl.prototype.hasDisabledSearch);


/**
 * Get the placeholder text to display in the search box.
 * @param {Array<string>=} opt_ids The search ids to consider in the text
 * @return {string}
 */
os.ui.search.SearchBoxCtrl.prototype.getPlaceholderText = function(opt_ids) {
  if (this['searchOptions'].length > 0) {
    var enabled = this['searchOptions'].filter(function(search) {
      return search.isEnabled();
    });

    if (enabled.length == 1) {
      return 'Search ' + enabled[0].getName() + '...';
    } else if (enabled.length == this['searchOptions'].length) {
      return 'Search All Types...';
    } else if (enabled.length == 0) {
      return 'No search types enabled.';
    } else {
      var selectedGroup = this.singleGroupSelected();
      if (selectedGroup) {
        return 'Search ' + selectedGroup + '...';
      }
      return 'Search ' + enabled.length + ' types...';
    }
  }

  return 'No search types available.';
};
goog.exportProperty(
    os.ui.search.SearchBoxCtrl.prototype,
    'getPlaceholderText',
    os.ui.search.SearchBoxCtrl.prototype.getPlaceholderText);


/**
 * Gets the selected search options to display
 * @return {string}
 */
os.ui.search.SearchBoxCtrl.prototype.getDropdownText = function() {
  if (this['searchOptions'].length > 0) {
    var enabled = this['searchOptions'].filter(function(search) {
      return search.isEnabled();
    });

    if (enabled.length == 1) {
      return enabled[0].getName();
    } else if (enabled.length == this['searchOptions'].length) {
      return 'All';
    } else if (enabled.length == 0) {
      return 'None';
    } else {
      var selectedGroup = this.singleGroupSelected();
      if (selectedGroup) {
        return selectedGroup;
      }
      return enabled.length + ' Types';
    }
  }

  return 'None';
};
goog.exportProperty(
    os.ui.search.SearchBoxCtrl.prototype,
    'getDropdownText',
    os.ui.search.SearchBoxCtrl.prototype.getDropdownText);


/**
 * Get the detail text to display for a recent search.
 * @param {!osx.search.RecentSearch} recent The recent search object
 * @return {string}
 */
os.ui.search.SearchBoxCtrl.prototype.getRecentDetails = function(recent) {
  var text = '';

  var ids = recent.ids;
  if (ids.length > 0) {
    var allIds = this.searchManager.getRegisteredSearches().map(os.search.getSearchId).sort();
    if (goog.array.equals(ids, allIds)) {
      // ids are an exact match (assumes both lists are sorted)
      text = '(All Search Types)';
    } else if (ids.length == 1) {
      // show the name if only one type
      var search = this.searchManager.getSearch(ids[0]);
      if (search && search.getName()) {
        text = '(' + search.getName() + ')';
      } else {
        // best effort, but this shouldn't happen.
        text = '(1 Search Type)';
      }
    } else {
      // otherwise show the number of types
      text = '(' + ids.length + ' Search Types)';
    }
  }

  return text;
};
goog.exportProperty(
    os.ui.search.SearchBoxCtrl.prototype,
    'getRecentDetails',
    os.ui.search.SearchBoxCtrl.prototype.getRecentDetails);


/**
 * Get the tooltip text to display for a recent search.
 * @param {!osx.search.RecentSearch} recent The recent search object
 * @return {string}
 */
os.ui.search.SearchBoxCtrl.prototype.getRecentTitle = function(recent) {
  var text = 'Load recent search';

  var ids = recent.ids;
  if (ids.length > 0) {
    var allIds = this.searchManager.getRegisteredSearches().map(os.search.getSearchId).sort();
    if (goog.array.equals(ids, allIds)) {
      // ids are an exact match (assumes both lists are sorted)
      text = 'Search all types for "' + recent.term + '".';
    } else if (ids.length == 1) {
      // show the name if only one type
      var search = this.searchManager.getSearch(ids[0]);
      if (search && search.getName()) {
        text = 'Search ' + search.getName() + ' for "' + recent.term + '".';
      }
    } else {
      // otherwise show the number of types
      var separator = '\n - ';
      text = 'Search the following types for "' + recent.term + '":' + separator;

      var names = ids.map(function(id) {
        var search = this.searchManager.getSearch(id);
        if (search) {
          return search.getName();
        }
        return 'Unknown search type';
      }, this);

      text += names.join(separator);
    }
  }

  return text;
};
goog.exportProperty(
    os.ui.search.SearchBoxCtrl.prototype,
    'getRecentTitle',
    os.ui.search.SearchBoxCtrl.prototype.getRecentTitle);


/**
 * Sets the search term/type to a recent one.
 * @param {!osx.search.RecentSearch} recent
 */
os.ui.search.SearchBoxCtrl.prototype.setFromRecent = function(recent) {
  // set the term to the recent value
  this['searchTerm'] = recent.term;

  // update which search providers are enabled
  for (var i = 0; i < this['searchOptions'].length; i++) {
    var search = /** @type {!os.search.ISearch} */ (this['searchOptions'][i]);
    if (recent.ids.indexOf(search.getId()) > -1) {
      search.setEnabled(true);
    } else {
      search.setEnabled(false);
    }
  }

  this.search();

  // move the item to the top of the recent list
  var recentIndex = goog.array.indexOf(this['recentSearches'], recent);
  if (recentIndex > 0) {
    goog.array.moveItem(this['recentSearches'], recentIndex, 0);
  }

  // save recent searches
  this.saveRecent_();
};
goog.exportProperty(
    os.ui.search.SearchBoxCtrl.prototype,
    'setFromRecent',
    os.ui.search.SearchBoxCtrl.prototype.setFromRecent);


/**
 * Update autocomplete results.
 */
os.ui.search.SearchBoxCtrl.prototype.refreshAutocomplete = function() {
  this.autocompleteSrc_.data('typeahead').source = [];

  if (this['searchTerm']) {
    this.searchManager.autocomplete(this['searchTerm'], 10);
  }
};
goog.exportProperty(
    os.ui.search.SearchBoxCtrl.prototype,
    'refreshAutocomplete',
    os.ui.search.SearchBoxCtrl.prototype.refreshAutocomplete);


/**
 * Toggle search options on/off.
 * @param {angular.Scope.Event} event
 */
os.ui.search.SearchBoxCtrl.prototype.toggleSearchOptions = function(event) {
  var originalEvent = event.originalEvent;

  this['showSearchOptions'] = !this['showSearchOptions'];

  if (this['showSearchOptions']) {
    // save the ids of currently enabled searches
    var enabledIds = this.searchManager.getEnabledSearches().map(os.search.getSearchId).sort();
    var listenKey = goog.events.listen(document, 'click', function(e) {
      if (this.element) {
        var event = /** @type {goog.events.BrowserEvent} */ (e);
        var optionsEl = this.element.find('.search-options')[0] || null;
        var recentsEl = this.element.find('.recent-searches')[0] || null;

        //
        // Handle the event if this isn't the click event that opened the options and it meets one of these criteria:
        //  - The click was outside the search options
        //  - The click was on a recent search
        //  - Only one search type is allowed
        //
        var optionsClicked = goog.dom.contains(optionsEl, event.target);
        var recentClicked = goog.dom.contains(recentsEl, event.target);
        if (event.getBrowserEvent() != originalEvent && (!optionsClicked || recentClicked || !this['allowMultiple'])) {
          // clean up the listener and kill the event
          goog.events.unlistenByKey(listenKey);
          event.stopPropagation();

          // close options
          this['showSearchOptions'] = false;

          // if enabled searches changed while the options were open, run the search again. don't bother for recents
          // because they already update the search.
          if (!recentClicked) {
            var newEnabledIds = this.searchManager.getEnabledSearches().map(os.search.getSearchId).sort();
            if (!goog.array.equals(newEnabledIds, enabledIds)) {
              this.search();
            }
          }

          os.ui.apply(this.scope);
        }
      }
    }, false, this);
  }
};
goog.exportProperty(
    os.ui.search.SearchBoxCtrl.prototype,
    'toggleSearchOptions',
    os.ui.search.SearchBoxCtrl.prototype.toggleSearchOptions);


/**
 * Handle search success event.
 * @param {os.search.SearchEvent} event
 * @private
 */
os.ui.search.SearchBoxCtrl.prototype.populateAutocomplete_ = function(event) {
  var results = event.getResults();
  if (results && results.length > 0) {
    var typeahead = this.autocompleteSrc_.data('typeahead');
    var current = typeahead['source'].concat(results);
    goog.array.removeDuplicates(current); // don't allow dupes in auto-complete results
    typeahead['source'] = current;
    typeahead['lookup']();
  }
};


/**
 * Maintain a list of recent search term/type pairs
 * @protected
 */
os.ui.search.SearchBoxCtrl.prototype.updateRecents = function() {
  if (this['searchTerm']) {
    var enabledIds = this.searchManager.getEnabledSearches().map(os.search.getSearchId).sort();

    var recentIndex = goog.array.findIndex(this['recentSearches'], function(recent) {
      return recent.term == this['searchTerm'];
    }, this);

    if (recentIndex > -1) {
      // already in the array, so move it to the top
      goog.array.moveItem(this['recentSearches'], recentIndex, 0);
    } else {
      var recent = /** @type {!osx.search.RecentSearch} */ ({
        ids: enabledIds,
        term: this['searchTerm']
      });

      this['recentSearches'].unshift(recent);

      if (this['recentSearches'].length > os.ui.search.SearchBoxCtrl.MAX_RECENT_) {
        this['recentSearches'].length = os.ui.search.SearchBoxCtrl.MAX_RECENT_;
      }
    }

    this.saveRecent_();
  }
};


/**
 * Save recent searches to config.
 * @private
 */
os.ui.search.SearchBoxCtrl.prototype.saveRecent_ = function() {
  var recentCopy = [];
  this['recentSearches'].forEach(function(recent) {
    // manually clone to avoid properties like $$hashKey that may be added by Angular
    if (recent.ids) {
      var recentSearch = /** @type {!osx.search.RecentSearch} */ ({
        ids: recent.ids.slice(),
        term: recent.term
      });
      recentCopy.push(recentSearch);
    }
  });

  os.settings.set(os.search.SearchSetting.RECENT, recentCopy);
};


/**
 * Run a favorite search
 * @param {os.search.Favorite} favorite
 */
os.ui.search.SearchBoxCtrl.prototype.favoriteSearch = function(favorite) {
  os.dispatcher.dispatchEvent(new goog.events.Event(os.search.SearchEventType.FAVORITE, favorite));
  this['showSearchOptions'] = false;
  os.ui.apply(this.scope);
};
goog.exportProperty(
    os.ui.search.SearchBoxCtrl.prototype,
    'favoriteSearch',
    os.ui.search.SearchBoxCtrl.prototype.favoriteSearch);


/**
 * Update the favorites
 * @private
 */
os.ui.search.SearchBoxCtrl.prototype.onFavoritesUpdate_ = function() {
  // Read in favorites
  this['favorites'] = os.searchManager.getFavorites(5);
  os.ui.apply(this.scope);
};


/**
 * @param {os.search.Favorite} favorite
 * @return {boolean}
 */
os.ui.search.SearchBoxCtrl.prototype.isFavoriteActive = function(favorite) {
  // Is the url the same after the hash?
  var current = location.href.split('#');
  var fav = favorite['uri'].split('#');
  return current.length == 2 && fav.length == 2 && current[1] == fav[1];
};
goog.exportProperty(
    os.ui.search.SearchBoxCtrl.prototype,
    'isFavoriteActive',
    os.ui.search.SearchBoxCtrl.prototype.isFavoriteActive);
