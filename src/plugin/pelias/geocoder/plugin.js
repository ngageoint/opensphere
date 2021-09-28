goog.declareModuleId('plugin.pelias.geocoder.Plugin');

import {ID} from './geocoder.js';
import Search from './search.js';

const settings = goog.require('os.config.Settings');
const SearchManager = goog.require('os.search.SearchManager');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');

/**
 * Provides Pelias Geocoder (text -> coordinates) search
 */
export default class Plugin extends AbstractPlugin {
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
