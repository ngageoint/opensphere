goog.module('plugin.pelias.geocoder.Plugin');
goog.module.declareLegacyNamespace();

const settings = goog.require('os.config.Settings');
const SearchManager = goog.require('os.search.SearchManager');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const {ID} = goog.require('plugin.pelias.geocoder');
const Search = goog.require('plugin.pelias.geocoder.Search');


/**
 * Provides Pelias Geocoder (text -> coordinates) search
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
    var uri = settings.getInstance().get(['plugin', 'pelias', 'geocoder', 'url']);

    if (uri) {
      SearchManager.getInstance().registerSearch(new Search('Place search (Pelias)'));
    }
  }
}

exports = Plugin;
