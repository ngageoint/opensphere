goog.provide('os.search.AbstractSearch');

goog.require('goog.events.EventTarget');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.search');
goog.require('os.search.Favorite');
goog.require('os.search.ISearch');



/**
 * Abstract implementation of a search provider.
 *
 * @abstract
 * @param {string} id The unique identifier for the search provider.
 * @param {string} name The user-facing name of the search provider.
 * @param {string=} opt_type The search type
 * @param {number=} opt_priority The search priority
 * @param {boolean=} opt_defaultEnabled The default enabled state
 * @extends {goog.events.EventTarget}
 * @implements {os.search.ISearch}
 * @constructor
 */
os.search.AbstractSearch = function(id, name, opt_type, opt_priority, opt_defaultEnabled) {
  os.search.AbstractSearch.base(this, 'constructor');

  /**
   * @type {string}
   * @protected
   */
  this.id = id;

  var defaultEnabled = opt_defaultEnabled != null ? opt_defaultEnabled : true;

  /**
   * If the search provider is enabled.
   * @type {boolean}
   */
  this['enabled'] = /** @type {boolean} */ (os.settings.get(
      os.search.getSettingKey(this, os.search.SearchSetting.ENABLED), defaultEnabled));


  /**
   * The user-facing name of the search provider.
   * @type {string}
   */
  this['name'] = name;

  /**
   * The search priority.
   * @type {number}
   * @protected
   */
  this.priority = opt_priority != null ? opt_priority : 0;

  /**
   * The search type.
   * @type {string}
   * @protected
   */
  this.type = opt_type || '';

  /**
   * The last search term.
   * @type {?string}
   * @protected
   */
  this.term = null;

  /**
   * Is the search provider external?
   * @type {boolean}
   * @private
   */
  this.isExternal_ = false;

  /**
   * The grid options for this search provider
   * @type {os.ui.draw.GridOptions}
   * @protected
   */
  this.gridOptions_ = null;

  /**
   * The logger used by the search provider.
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.search.AbstractSearch.LOGGER_;
};
goog.inherits(os.search.AbstractSearch, goog.events.EventTarget);


/**
 * Logger for os.search.AbstractSearch
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.search.AbstractSearch.LOGGER_ = goog.log.getLogger('os.search.AbstractSearch');


/**
 * @inheritDoc
 */
os.search.AbstractSearch.prototype.isEnabled = function() {
  return this['enabled'];
};


/**
 * @inheritDoc
 */
os.search.AbstractSearch.prototype.setEnabled = function(value) {
  this['enabled'] = value;
  os.settings.set(os.search.getSettingKey(this, os.search.SearchSetting.ENABLED), value);
};


/**
 * @inheritDoc
 */
os.search.AbstractSearch.prototype.getId = function() {
  return this.id;
};


/**
 * @inheritDoc
 */
os.search.AbstractSearch.prototype.getName = function() {
  return this['name'];
};


/**
 * @inheritDoc
 */
os.search.AbstractSearch.prototype.getPriority = function() {
  return this.priority;
};


/**
 * @inheritDoc
 */
os.search.AbstractSearch.prototype.getType = function() {
  return this.type;
};


/**
 * @inheritDoc
 */
os.search.AbstractSearch.prototype.search = function(term, opt_start, opt_pageSize, opt_sortBy, opt_noFacets) {
  this.term = term;
  return this.searchTerm.apply(this, arguments);
};


/**
 * @inheritDoc
 */
os.search.AbstractSearch.prototype.supportsSearchTerm = function(term) {
  // All implementations should supprt a string search term.
  if (term && typeof term === 'string') {
    return true;
  }
  return false;
};


/**
 * @inheritDoc
 */
os.search.AbstractSearch.prototype.shouldNormalize = function() {
  return true;
};


/**
 * @abstract
 * @inheritDoc
 */
os.search.AbstractSearch.prototype.cancel = function() {};


/**
 * @abstract
 * @inheritDoc
 */
os.search.AbstractSearch.prototype.autocomplete = function(term, opt_maxResults) {};


/**
 * Search for a term.
 *
 * @abstract
 * @param {string} term The keyword to use in the search
 * @param {number=} opt_start The start index of the page of results to return.
 *   Defaults to the first page.
 * @param {number=} opt_pageSize The number of results to return per page.
 *   Defaults to an appropriate value.
 * @return {boolean} Return true to continue, othereise false.
 */
os.search.AbstractSearch.prototype.searchTerm = function(term, opt_start, opt_pageSize) {};


/**
 * @inheritDoc
 */
os.search.AbstractSearch.prototype.isExternal = function() {
  return this.isExternal_;
};


/**
 * @inheritDoc
 */
os.search.AbstractSearch.prototype.setExternal = function(external) {
  this.isExternal_ = external;
};


/**
 * @inheritDoc
 */
os.search.AbstractSearch.prototype.hasGridOptions = function() {
  return (this.gridOptions_ != null);
};


/**
 * @inheritDoc
 */
os.search.AbstractSearch.prototype.getGridOptions = function() {
  return this.gridOptions_;
};


/**
 * @inheritDoc
 */
os.search.AbstractSearch.prototype.setGridOptions = function(gridOptions) {
  this.gridOptions_ = gridOptions;
};


/**
 * DEPRECATED
 *
 * @param {string} term
 * @param {number=} opt_start
 * @param {number=} opt_pageSize
 * @return {boolean}
 */
os.search.AbstractSearch.prototype.searchFavorite = function(term, opt_start, opt_pageSize) {
  return true;
};


/**
 * DEPRECATED
 * Returns search favorites
 *
 * @param {number} max max number of favorites to return
 * @return {Array<os.search.Favorite>}
 */
os.search.AbstractSearch.prototype.getFavorites = function(max) {
  return [];
};
