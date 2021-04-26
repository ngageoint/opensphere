goog.module('plugin.google.places.Plugin');
goog.module.declareLegacyNamespace();

const Settings = goog.require('os.config.Settings');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const SearchManager = goog.require('os.search.SearchManager');
const {ID} = goog.require('plugin.google.places');
const Search = goog.require('plugin.google.places.Search');


/**
 * Provides GeoNames search
 */
class Plugin extends AbstractPlugin {
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
    const uri = Settings.getInstance().get(['plugin', 'google', 'places', 'url']);
    if (uri) {
      SearchManager.getInstance().registerSearch(new Search('Places (Google)'));
    }
  }
}

exports = Plugin;
