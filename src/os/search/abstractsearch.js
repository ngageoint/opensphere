goog.declareModuleId('os.search.AbstractSearch');

import Settings from '../config/settings.js';
import ISearch from './isearch.js';// eslint-disable-line
import {SearchSetting, getSettingKey} from './search.js';

const EventTarget = goog.require('goog.events.EventTarget');
const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');
const {default: Favorite} = goog.requireType('os.search.Favorite');


/**
 * Abstract implementation of a search provider.
 *
 * @abstract
 * @implements {ISearch}
 * @unrestricted
 */
export default class AbstractSearch extends EventTarget {
  /**
   * Constructor.
   * @param {string} id The unique identifier for the search provider.
   * @param {string} name The user-facing name of the search provider.
   * @param {string=} opt_type The search type
   * @param {number=} opt_priority The search priority
   * @param {boolean=} opt_defaultEnabled The default enabled state
   */
  constructor(id, name, opt_type, opt_priority, opt_defaultEnabled) {
    super();

    /**
     * @type {string}
     * @protected
     */
    this.id = id;

    const defaultEnabled = opt_defaultEnabled != null ? opt_defaultEnabled : true;

    /**
     * If the search provider is enabled.
     * @type {boolean}
     */
    this['enabled'] = /** @type {boolean} */ (Settings.getInstance().get(
        getSettingKey(this, SearchSetting.ENABLED), defaultEnabled));


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
     * The logger used by the search provider.
     * @type {Logger}
     * @protected
     */
    this.log = logger;
  }

  /**
   * @inheritDoc
   */
  isEnabled() {
    return this['enabled'];
  }

  /**
   * @inheritDoc
   */
  setEnabled(value) {
    this['enabled'] = value;
    Settings.getInstance().set(getSettingKey(this, SearchSetting.ENABLED), value);
  }

  /**
   * @inheritDoc
   */
  getId() {
    return this.id;
  }

  /**
   * @inheritDoc
   */
  getName() {
    return this['name'];
  }

  /**
   * @inheritDoc
   */
  getPriority() {
    return this.priority;
  }

  /**
   * @inheritDoc
   */
  getType() {
    return this.type;
  }

  /**
   * @inheritDoc
   */
  search(term, opt_start, opt_pageSize, opt_sortBy, opt_noFacets) {
    this.term = term;
    return this.searchTerm.apply(this, arguments);
  }

  /**
   * @inheritDoc
   */
  supportsSearchTerm(term) {
    // All implementations should support a string search term.
    if (term && typeof term === 'string') {
      return true;
    }
    return false;
  }

  /**
   * @inheritDoc
   */
  shouldNormalize() {
    return true;
  }

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
  searchTerm(term, opt_start, opt_pageSize) {}

  /**
   * @inheritDoc
   */
  isExternal() {
    return this.isExternal_;
  }

  /**
   * @inheritDoc
   */
  setExternal(external) {
    this.isExternal_ = external;
  }

  /**
   * DEPRECATED
   *
   * @deprecated
   * @param {string} term
   * @param {number=} opt_start
   * @param {number=} opt_pageSize
   * @return {boolean}
   */
  searchFavorite(term, opt_start, opt_pageSize) {
    return true;
  }

  /**
   * DEPRECATED
   * Returns search favorites
   *
   * @deprecated
   * @param {number} max max number of favorites to return
   * @return {Array<Favorite>}
   */
  getFavorites(max) {
    return [];
  }
}

/**
 * Logger for AbstractSearch
 * @type {Logger}
 */
const logger = log.getLogger('os.search.AbstractSearch');
