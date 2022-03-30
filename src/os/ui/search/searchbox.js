goog.declareModuleId('os.ui.search.SearchBoxUI');

import {findIndex} from 'ol/src/array.js';

import '../dragdrop/dragdropui.js';
import Settings from '../../config/settings.js';
import * as dispatcher from '../../dispatcher.js';
import osImplements from '../../implements.js';
import {ROOT} from '../../os.js';
import PluginManager from '../../plugin/pluginmanager.js';
import ISubSearch from '../../search/isubsearch.js';
import * as osSearch from '../../search/search.js';
import SearchEventType from '../../search/searcheventtype.js';
import SearchManager from '../../search/searchmanager.js';
import SubSearchUtils from '../../search/subsearchutils.js';
import TriState from '../../structs/tristate.js';
import FavoriteManager from '../../user/settings/favoritemanager.js';
import Module from '../module.js';
import {TypeaheadEventType, apply} from '../ui.js';

const googArray = goog.require('goog.array');
const {contains: domContains, getAncestorByClass} = goog.require('goog.dom');
const googEvents = goog.require('goog.events');
const GoogEvent = goog.require('goog.events.Event');
const GoogEventType = goog.require('goog.events.EventType');

const {default: Favorite} = goog.requireType('os.search.Favorite');
const {default: ISearch} = goog.requireType('os.search.ISearch');
const {default: SearchEvent} = goog.requireType('os.search.SearchEvent');
const {default: SearchScrollDataSource} = goog.requireType('os.ui.search.SearchScrollDataSource');


/**
 * The search-box directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: {
    'dataSource': '=datasource',
    'allowMultiple': '@',
    'eventPrefix': '@',
    'searchOnClear': '@',
    'showDropdownText': '@',
    'searchManager': '=?',
    'showClear': '@?'
  },
  templateUrl: ROOT + 'views/search/searchbox.html',
  controller: Controller,
  controllerAs: 'searchBox'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'search-box';


/**
 * Register the search-box directive.
 */
Module.directive('searchBox', [directive]);



/**
 * Controller function for the search-box directive.
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
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
     * @type {SearchManager}
     * @protected
     */
    this.searchManager = $scope['searchManager'] || SearchManager.getInstance();

    /**
     * The prefix to use for search events.
     * @type {string}
     * @protected
     */
    this.eventPrefix = $scope && $scope['eventPrefix'] || '';

    /**
     * Prebound search call, for event listeners without a context parameter.
     * @type {!Function}
     * @protected
     */
    this.boundSearch = this.search.bind(this);

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
     * @type {!Array<!ISearch>}
     */
    this['searchOptions'] = [];

    /**
     * @type {!Array<!osx.search.RecentSearch>}
     */
    this['recentSearches'] = /** @type {!Array<!osx.search.RecentSearch>} */ (Settings.getInstance().get(
        osSearch.SearchSetting.RECENT, []));

    /**
     * @type {!jQuery}
     * @private
     */
    this.autocompleteSrc_ = /** @type {!jQuery} */ ($element.find('.js-searchbox__typeahead')).typeahead();
    // trigger a search when the user clicks an autocomplete item
    this.autocompleteSrc_.on(TypeaheadEventType.CLICK, this.boundSearch);

    googEvents.listen($element[0], 'click', this.onClick_, false, this);
    this.searchManager.listen(GoogEventType.CHANGE, this.onSearchManagerChange, false, this);
    this.searchManager.listen(SearchEventType.START, this.onSearchStart_, false, this);
    this.searchManager.listen(SearchEventType.AUTOCOMPLETED, this.populateAutocomplete_, false, this);
    this.searchManager.listen(SearchEventType.SUCCESS, this.onSearchSuccess_, false, this);
    dispatcher.getInstance().listen(SearchEventType.REFRESH, this.search, false, this);
    this.onSearchManagerChange();

    /**
     * @type {!Array<string>}
     */
    this['providerGroups'] = [];

    /**
     * @type {!Object}
     */
    this['searchOptionsGroups'] = {};

    /**
     * @type {!Array<!ISearch>}
     */
    this['searchOptionsNoGroup'] = [];


    /**
     * Listener for click event
     * @type {?goog.events.ListenableKey|number}
     */
    this.listenKey = null;

    this.setUpGroups();

    // make sure the plugin manager is loaded before migrating recent searches, or they will not be migrated correctly.
    const pm = PluginManager.getInstance();
    if (pm.ready) {
      this.validateRecents_();
    } else {
      pm.listenOnce(GoogEventType.LOAD, this.validateRecents_, false, this);
    }

    this.onFavoritesUpdate();
    Settings.getInstance().listen(FavoriteManager.KEY, this.onFavoritesUpdate, false, this);
    $scope.$on('$destroy', this.destroy.bind(this));
  }

  /**
   * Clean up the controller.
   *
   * @protected
   */
  destroy() {
    googEvents.unlisten(this.element[0], 'click', this.onClick_, false, this);

    if (this.autocompleteSrc_) {
      this.autocompleteSrc_.off(TypeaheadEventType.CLICK, this.boundSearch);
    }

    if (this.listenKey) {
      googEvents.unlistenByKey(this.listenKey);
      this.listenKey = null;
    }

    this.searchManager.unlisten(GoogEventType.CHANGE, this.onSearchManagerChange, false, this);
    this.searchManager.unlisten(SearchEventType.START, this.onSearchStart_, false, this);
    this.searchManager.unlisten(SearchEventType.AUTOCOMPLETED, this.populateAutocomplete_, false, this);
    this.searchManager.unlisten(SearchEventType.SUCCESS, this.onSearchSuccess_, false, this);
    dispatcher.getInstance().unlisten(SearchEventType.REFRESH, this.search, false, this);
    Settings.getInstance().unlisten(FavoriteManager.KEY, this.onFavoritesUpdate, false, this);

    this.element = null;
    this.scope = null;
  }

  /**
   * Validate recent searches. This both migrates the old format to the new, and verifies the search ids are registered.
   * This must be called after all search types have been registered with the application.
   *
   * @private
   */
  validateRecents_() {
    const recents = /** @type {!Array<!osx.search.RecentSearch>} */ (this['recentSearches']);
    if (recents) {
      let updated = false;

      try {
        const searches = this.searchManager.getRegisteredSearches();
        const allIds = searches.map(osSearch.getSearchId).sort();
        let i = recents.length;
        while (i--) {
          const recent = recents[i];
          if ('type' in recent) {
            //
            // This recent search is in the old format, so migrate it to the new one if possible.
            //

            const oldName = /** @type {string} */ (recent['type'] || '');
            updated = true;

            if (recent['type'] == osSearch.SEARCH_ALL) {
              // assume the available providers haven't changed and enable all
              recent.ids = allIds;
            } else {
              const search = olArray.find(searches, osSearch.isNameEqual.bind(undefined, oldName));
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

            let idCount = recent.ids.length;
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
  }

  /**
   * Handles click events, and if they came from the typeahead, execute a search.
   *
   * @param {goog.events.BrowserEvent} event
   * @private
   */
  onClick_(event) {
    if (getAncestorByClass(event.target, 'typeahead')) {
      this.search();
    }
  }

  /**
   * Clear the search.
   *
   * @export
   */
  clear() {
    this['searchTerm'] = '';
    this.search();
  }

  /**
   * Perform a search.
   *
   * @export
   */
  search() {
    if (this['searchTerm'] || this.searchOnClear_) {
      if (this.scope['dataSource']) {
        const dataSource = /** @type {SearchScrollDataSource} */ (this.scope['dataSource']);
        dataSource.setTerm(this.getSearchTerm_());
      } else {
        this.searchManager.search(this.getSearchTerm_());
      }

      apply(this.scope);
    }
  }

  /**
   * Gets the search term
   *
   * @return {string}
   * @private
   */
  getSearchTerm_() {
    return this['searchTerm'];
  }

  /**
   * Handles changes to the search manager.
   *
   * @param {GoogEvent=} opt_event
   * @protected
   */
  onSearchManagerChange(opt_event) {
    // update available options and the selection
    this['searchOptions'] = this.searchManager.getRegisteredSearches();
    this.setUpGroups();

    // update the favorites
    this.onFavoritesUpdate();

    if (!this['allowMultiple']) {
      // if multiple providers aren't allowed, make sure only one is enabled
      let foundEnabled = false;
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

    apply(this.scope);
  }

  /**
   * Handle search start event.  Assign term to its most current value, keeps multiple searchbox instances in sync.
   *
   * @param {SearchEvent} event
   * @private
   */
  onSearchStart_(event) {
    const term = event.getTerm();
    if (term !== this['searchTerm']) {
      this['searchTerm'] = term;
    }
    this.updateRecents();
  }

  /**
   * Make sure our search term stays in sync with the search manager
   *
   * @param {SearchEvent} event
   * @private
   */
  onSearchSuccess_(event) {
    if (this['searchTerm'] != this.searchManager.getTerm()) {
      this['searchTerm'] = this.searchManager.getTerm();
    }
  }

  /**
   * Toggles a search on/off.
   *
   * @param {!ISearch} search The search provider
   * @export
   */
  toggleSearch(search) {
    // always toggle if multiple types are available, otherwise only allow enabling a search. this prevents disabling all
    // search types in single mode.
    if (this['allowMultiple'] || !search.isEnabled()) {
      if (osImplements(search, ISubSearch.ID) &&
      /** @type {ISubSearch} */ (search).isSubSearchCapabilityEnabled() &&
      /** @type {ISubSearch} */ (search).getRegisteredSubSearches().length) {
        const subSearch = /** @type {ISubSearch} */ (search);
        /**
         * @type {TriState}
         */
        const state = subSearch.isSubSearchEnabled();
        if (state === TriState.ON) {
          search.setEnabled(false);
          subSearch.setEnabledSubSearches([]);
        } else {
          const defaultDisabledSubSearches = subSearch.getDefaultDisabledSubSearches();
          const defaultEnabledSubSearches = subSearch.getRegisteredSubSearches().filter((ss) => {
            return !SubSearchUtils.isDefaultDisabled(defaultDisabledSubSearches, ss);
          });
          search.setEnabled(true);
          subSearch.setEnabledSubSearches(defaultEnabledSubSearches);
        }
      } else {
        search.setEnabled(!search.isEnabled());
      }
    }

    if (!this['allowMultiple'] && search.isEnabled()) {
      this['searchOptions'].forEach(function(next) {
        if (next != search && next.isEnabled()) {
          next.setEnabled(false);
        }
      });
    }
  }

  /**
   * Toggles all searches on/off.
   *
   * @param {boolean} value The new enabled value
   * @export
   */
  toggleAll(value) {
    this['searchOptions'].forEach(function(search) {
      search.setEnabled(value);
    });
  }

  /**
   * Get the name of a search.
   *
   * @param {!ISearch} search The search provider
   * @return {string}
   * @export
   */
  getSearchName(search) {
    return search.getName();
  }

  /**
   * Get the name of a search.
   *
   * @param {!ISearch} search The search provider
   * @return {string}
   * @export
   */
  getSearchIcon(search) {
    if (this['allowMultiple']) {
      if (osImplements(search, ISubSearch.ID) &&
      /** @type {ISubSearch} */ (search).isSubSearchCapabilityEnabled() &&
      /** @type {ISubSearch} */ (search).getRegisteredSubSearches().length &&
          search.isEnabled()) {
        const ss = /** @type {ISubSearch} */ (search);
        /**
         * @type {TriState}
         */
        const state = ss.isSubSearchEnabled();
        if (state === TriState.ON) {
          return 'fas fa-check-square';
        } else if (state === TriState.BOTH) {
          return 'fas fa-minus-square';
        } else {
          return 'far fa-square';
        }
      } else {
        return search.isEnabled() ? 'fas fa-check-square' : 'far fa-square';
      }
    } else if (search.isEnabled()) {
      return 'fa-angle-double-right';
    }

    return '';
  }

  /**
   * Set up the grouped searches, along with the searches not in a group.
   */
  setUpGroups() {
    this['providerGroups'] = [];
    this['searchOptionsGroups'] = {};
    this['searchOptionsNoGroup'] = [];

    const proGroups = /** @type {!Object<!Array<string>>} */ (Settings.getInstance().get('providerGroups', {}));
    const copiedOptions = googArray.clone(this['searchOptions']);

    // Iterate over the Provider group names
    for (const groupName in proGroups) {
      const searchNameArray = proGroups[groupName];

      this['providerGroups'].push(groupName);

      const currentGroup = [];

      // Iterate over the searches under the provider group, and add the search to the group
      searchNameArray.forEach(function(searchName) {
        const ind = findIndex(copiedOptions, function(searchOption) {
          return searchName == searchOption.getName();
        });
        if (ind > -1) {
          currentGroup.push(copiedOptions[ind]);
          googArray.removeAt(copiedOptions, ind);
        }
      }, this);
      this['searchOptionsGroups'][groupName] = currentGroup;
    }

    const order = /** @type {Array} */ (Settings.getInstance().get('providerGroupOrder', []));
    order.forEach(function(value, index) {
      const currentIndex = this['providerGroups'].indexOf(value);
      if (currentIndex > 0) {
        googArray.moveItem(this['providerGroups'], currentIndex, index);
      }
    }, this);

    this['searchOptionsNoGroup'] = copiedOptions;
  }

  /**
   * Get the group icon
   *
   * @param {string} group The group
   * @return {string}
   * @export
   */
  getGroupIcon(group) {
    if (this.allSearchesEnabled(group)) {
      return 'fa-check-square-o';
    } else if (this.allSearchesDisabled(group)) {
      return 'fa-square-o';
    }
    return 'fa-minus-square-o';
  }

  /**
   * Get whether all searches in a group are enabled
   *
   * @param {string} group The group
   * @return {boolean}
   */
  allSearchesEnabled(group) {
    const searches = this['searchOptionsGroups'][group];
    let allEnabled = true;
    for (let i = 0; i < searches.length; i++) {
      if (!searches[i].isEnabled()) {
        allEnabled = false;
        break;
      }
    }
    return allEnabled;
  }

  /**
   * Get whether all searches in a group are disabled
   *
   * @param {string} group The group
   * @return {boolean}
   */
  allSearchesDisabled(group) {
    const searches = this['searchOptionsGroups'][group];
    let allDisabled = true;
    for (let i = 0; i < searches.length; i++) {
      if (searches[i].isEnabled()) {
        allDisabled = false;
        break;
      }
    }
    return allDisabled;
  }

  /**
   * Enable/disable all the searches in a group
   *
   * @param {string} group The group
   * @export
   */
  toggleGroup(group) {
    const on = this.allSearchesEnabled(group);
    const searches = this['searchOptionsGroups'][group];
    for (let i = 0; i < searches.length; i++) {
      searches[i].setEnabled(!on);
    }
  }

  /**
   * Get a searchOptionsGroup
   *
   * @param {string} groupName The group name
   * @return {Array<ISearch>} The searches associated with groupName
   * @export
   */
  getSearchOptionsGroup(groupName) {
    const group = this['searchOptionsGroups'][groupName];
    googArray.sort(group, function(a, b) {
      return googArray.defaultCompare(a.getName(), b.getName());
    });
    return group;
  }

  /**
   * The name of the group that is completely and solely selected, otherwise an empty string
   *
   * @return {?string} The name of the group that is completely selected, false otherwise
   */
  singleGroupSelected() {
    if (this['providerGroups'].length == 0) {
      return null;
    }

    let numGroups = 0;
    let selectedGroup = '';

    const enabled = this['searchOptions'].filter(function(search) {
      return search.isEnabled();
    });

    for (let i = 0; i < this['providerGroups'].length; i++) {
      if (this.allSearchesEnabled(this['providerGroups'][i])) {
        numGroups += 1;
        selectedGroup = this['providerGroups'][i];
      }
    }
    if (numGroups == 1 && enabled.length == this['searchOptionsGroups'][selectedGroup].length) {
      return selectedGroup;
    }
    return null;
  }

  /**
   * If a search provider is enabled.
   *
   * @param {!ISearch} search The search provider
   * @return {boolean}
   * @export
   */
  isSearchEnabled(search) {
    return search.isEnabled();
  }

  /**
   * If at least one search provider is disabled.
   *
   * @return {boolean}
   * @export
   */
  hasDisabledSearch() {
    return googArray.some(this['searchOptions'], function(search) {
      return !search.isEnabled();
    });
  }

  /**
   * Get the placeholder text to display in the search box.
   *
   * @param {Array<string>=} opt_ids The search ids to consider in the text
   * @return {string}
   * @export
   */
  getPlaceholderText(opt_ids) {
    if (this['searchOptions'].length > 0) {
      const enabled = this['searchOptions'].filter(function(search) {
        return search.isEnabled();
      });

      if (enabled.length == 1) {
        return 'Search ' + enabled[0].getName() + '...';
      } else if (enabled.length == this['searchOptions'].length) {
        return 'Search All Types...';
      } else if (enabled.length == 0) {
        return 'No search types enabled.';
      } else {
        const selectedGroup = this.singleGroupSelected();
        if (selectedGroup) {
          return 'Search ' + selectedGroup + '...';
        }
        return 'Search ' + enabled.length + ' types...';
      }
    }

    return 'No search types available.';
  }

  /**
   * Get the detail text to display for a recent search.
   *
   * @param {!osx.search.RecentSearch} recent The recent search object
   * @return {string}
   * @export
   */
  getRecentDetails(recent) {
    let text = '';

    const ids = recent.ids;
    if (ids.length > 0) {
      const allIds = this.searchManager.getRegisteredSearches().map(osSearch.getSearchId).sort();
      if (googArray.equals(ids, allIds)) {
        // ids are an exact match (assumes both lists are sorted)
        text = '(All Search Types)';
      } else if (ids.length == 1) {
        // show the name if only one type
        const search = this.searchManager.getSearch(ids[0]);
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
  }

  /**
   * Get the tooltip text to display for a recent search.
   *
   * @param {!osx.search.RecentSearch} recent The recent search object
   * @return {string}
   * @export
   */
  getRecentTitle(recent) {
    let text = 'Load recent search';

    const ids = recent.ids;
    if (ids.length > 0) {
      const allIds = this.searchManager.getRegisteredSearches().map(osSearch.getSearchId).sort();
      if (googArray.equals(ids, allIds)) {
        // ids are an exact match (assumes both lists are sorted)
        text = 'Search all types for "' + recent.term + '".';
      } else if (ids.length == 1) {
        // show the name if only one type
        const search = this.searchManager.getSearch(ids[0]);
        if (search && search.getName()) {
          text = 'Search ' + search.getName() + ' for "' + recent.term + '".';
        }
      } else {
        // otherwise show the number of types
        const separator = '\n - ';
        text = 'Search the following types for "' + recent.term + '":' + separator;

        const names = ids.map(function(id) {
          const search = this.searchManager.getSearch(id);
          if (search) {
            return search.getName();
          }
          return 'Unknown search type';
        }, this);

        text += names.join(separator);
      }
    }

    return text;
  }

  /**
   * Sets the search term/type to a recent one.
   *
   * @param {!osx.search.RecentSearch} recent
   * @export
   */
  setFromRecent(recent) {
    // set the term to the recent value
    this['searchTerm'] = recent.term;

    // update which search providers are enabled
    for (let i = 0; i < this['searchOptions'].length; i++) {
      const search = /** @type {!ISearch} */ (this['searchOptions'][i]);
      if (recent.ids.indexOf(search.getId()) > -1) {
        search.setEnabled(true);
      } else {
        search.setEnabled(false);
      }
    }

    this.search();

    // move the item to the top of the recent list
    const recentIndex = googArray.indexOf(this['recentSearches'], recent);
    if (recentIndex > 0) {
      googArray.moveItem(this['recentSearches'], recentIndex, 0);
    }

    // save recent searches
    this.saveRecent_();
  }

  /**
   * Update autocomplete results.
   *
   * @export
   */
  refreshAutocomplete() {
    this.autocompleteSrc_.data('typeahead').source = [];

    if (this['searchTerm']) {
      this.searchManager.autocomplete(this['searchTerm'], 10);
    }
  }

  /**
   * Toggle search options on/off.
   *
   * @param {angular.Scope.Event} event
   * @export
   */
  toggleSearchOptions(event) {
    const originalEvent = event.originalEvent;

    this['showSearchOptions'] = !this['showSearchOptions'];

    if (this['showSearchOptions']) {
      // save the ids of currently enabled searches
      const enabledIds = {};
      enabledIds[TriState.ON] = [];
      enabledIds[TriState.BOTH] = [];
      this.searchManager.getEnabledSearches().forEach((search) => {
        if (osImplements(search, ISubSearch.ID) &&
        /** @type {ISubSearch} */ (search).isSubSearchCapabilityEnabled() &&
        /** @type {ISubSearch} */ (search).getRegisteredSubSearches().length) {
          const ss = /** @type {ISubSearch} */ (search);
          enabledIds[ss.isSubSearchEnabled()].push(osSearch.getSearchId(search));
        } else {
          enabledIds[TriState.ON].push(osSearch.getSearchId(search));
        }
      });
      this.listenKey = googEvents.listen(document, 'click', (e) => {
        if (this.element) {
          const event = /** @type {goog.events.BrowserEvent} */ (e);
          const optionsEl = this.element.find('.js-searchbox__search-options')[0] || null;
          const recentsEl = this.element.find('.js-searchbox__recent-searches')[0] || null;

          //
          // Handle the event if this isn't the click event that opened the options and it meets one of these criteria:
          //  - The click was outside the search options
          //  - The click was on a recent search
          //  - Only one search type is allowed
          //
          const optionsClicked = domContains(optionsEl, event.target);
          const recentClicked = domContains(recentsEl, event.target);
          if (event.getBrowserEvent() != originalEvent &&
              (!optionsClicked || recentClicked || !this['allowMultiple'])) {
            // clean up the listener and kill the event
            googEvents.unlistenByKey(this.listenKey);

            // close options
            this['showSearchOptions'] = false;

            // if enabled searches changed while the options were open, run the search again. don't bother for recents
            // because they already update the search.
            if (!recentClicked) {
              event.stopPropagation();
              const newEnabledIds = {};
              newEnabledIds[TriState.ON] = [];
              newEnabledIds[TriState.BOTH] = [];
              this.searchManager.getEnabledSearches().forEach((search) => {
                if (osImplements(search, ISubSearch.ID) &&
                /** @type {ISubSearch} */ (search).isSubSearchCapabilityEnabled() &&
                /** @type {ISubSearch} */ (search).getRegisteredSubSearches().length) {
                  const ss = /** @type {ISubSearch} */ (search);
                  newEnabledIds[ss.isSubSearchEnabled()].push(osSearch.getSearchId(search));
                } else {
                  newEnabledIds[TriState.ON].push(osSearch.getSearchId(search));
                }
              });
              if (!googArray.equals(newEnabledIds[TriState.ON], enabledIds[TriState.ON]) ||
                  !googArray.equals(newEnabledIds[TriState.BOTH], enabledIds[TriState.BOTH])) {
                this.search();
              }
            }

            apply(this.scope);
          }
        }
      }, true);
    }
  }

  /**
   * Handle search success event.
   *
   * @param {SearchEvent} event
   * @private
   */
  populateAutocomplete_(event) {
    const results = event.getResults();
    if (results && results.length > 0) {
      const typeahead = this.autocompleteSrc_.data('typeahead');
      const current = typeahead['source'].concat(results);
      googArray.removeDuplicates(current); // don't allow dupes in auto-complete results
      typeahead['source'] = current;
      typeahead['lookup']();
    }
  }

  /**
   * Maintain a list of recent search term/type pairs
   *
   * @protected
   */
  updateRecents() {
    if (this['searchTerm']) {
      const enabledIds = this.searchManager.getEnabledSearches().map(osSearch.getSearchId).sort();

      const recentIndex = findIndex(this['recentSearches'], function(recent) {
        return recent.term == this['searchTerm'];
      }.bind(this));

      if (recentIndex > -1) {
        // already in the array, so move it to the top
        googArray.moveItem(this['recentSearches'], recentIndex, 0);
      } else {
        const recent = /** @type {!osx.search.RecentSearch} */ ({
          ids: enabledIds,
          term: this['searchTerm']
        });

        this['recentSearches'].unshift(recent);

        if (this['recentSearches'].length > Controller.MAX_RECENT_) {
          this['recentSearches'].length = Controller.MAX_RECENT_;
        }
      }

      this.saveRecent_();
    }
  }

  /**
   * Save recent searches to config.
   *
   * @private
   */
  saveRecent_() {
    const recentCopy = [];
    this['recentSearches'].forEach(function(recent) {
      // manually clone to avoid properties like $$hashKey that may be added by Angular
      if (recent.ids) {
        const recentSearch = /** @type {!osx.search.RecentSearch} */ ({
          ids: recent.ids.slice(),
          term: recent.term
        });
        recentCopy.push(recentSearch);
      }
    });

    Settings.getInstance().set(osSearch.SearchSetting.RECENT, recentCopy);
  }

  /**
   * Run a favorite search
   *
   * @param {Favorite} favorite
   * @export
   */
  favoriteSearch(favorite) {
    dispatcher.getInstance().dispatchEvent(new GoogEvent(SearchEventType.FAVORITE, favorite));
    this['showSearchOptions'] = false;
    apply(this.scope);
  }

  /**
   * Update the favorites
   *
   * @protected
   */
  onFavoritesUpdate() {
    // Read in favorites
    this['favorites'] = SearchManager.getInstance().getFavorites(5);
    apply(this.scope);
  }

  /**
   * @param {Favorite} favorite
   * @return {boolean}
   * @export
   */
  isFavoriteActive(favorite) {
    // Is the url the same after the hash?
    const current = location.href.split('#');
    const fav = favorite['uri'].split('#');
    return current.length == 2 && fav.length == 2 && current[1] == fav[1];
  }

  /**
   * Checks to see if the search supports geosearch.
   *
   * @param {!ISearch} search The search.
   * @return {boolean}
   * @export
   */
  supportsGeo(search) {
    return osSearch.supportsGeoSearch(search);
  }

  /**
   * Checks to see if the search supports temporal search.
   *
   * @param {!ISearch} search The search.
   * @return {boolean}
   * @export
   */
  supportsTemporal(search) {
    return osSearch.supportsTemporalSearch(search);
  }
}


/**
 * Maximum number of search term/type pairs to remember.
 * @private
 * @const
 * @type {number}
 */
Controller.MAX_RECENT_ = 5;
