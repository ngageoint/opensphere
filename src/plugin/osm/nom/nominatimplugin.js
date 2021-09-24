goog.declareModuleId('plugin.osm.nom.NominatimPlugin');

import {ID, SEARCH_NAME, SettingKey} from './nominatim.js';
import NominatimSearch from './nominatimsearch.js';

const Settings = goog.require('os.config.Settings');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const SearchManager = goog.require('os.search.SearchManager');

/**
 * Provides an interface to the OSM Nominatim API.
 */
export default class NominatimPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = ID;
  }

  /**
   * @inheritDoc
   */
  init() {
    // register the search provider if configured
    const url = /** @type {string|undefined} */ (Settings.getInstance().get(SettingKey.URL));
    if (url) {
      const search = new NominatimSearch(SEARCH_NAME);
      SearchManager.getInstance().registerSearch(search);
    }
  }
}
