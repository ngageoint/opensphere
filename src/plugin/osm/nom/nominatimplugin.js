goog.module('plugin.osm.nom.NominatimPlugin');

const Settings = goog.require('os.config.Settings');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const SearchManager = goog.require('os.search.SearchManager');
const {ID, SEARCH_NAME, SettingKey} = goog.require('plugin.osm.nom');
const NominatimSearch = goog.require('plugin.osm.nom.NominatimSearch');


/**
 * Provides an interface to the OSM Nominatim API.
 */
class NominatimPlugin extends AbstractPlugin {
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

exports = NominatimPlugin;
