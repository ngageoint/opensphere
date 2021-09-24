goog.declareModuleId('plugin.google.places.Plugin');

import Search from './search.js';
import {ID} from './index.js';

const Settings = goog.require('os.config.Settings');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const SearchManager = goog.require('os.search.SearchManager');

/**
 * Provides GeoNames search
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
    const uri = Settings.getInstance().get(['plugin', 'google', 'places', 'url']);
    if (uri) {
      SearchManager.getInstance().registerSearch(new Search('Places (Google)'));
    }
  }
}
