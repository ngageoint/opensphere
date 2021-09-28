goog.declareModuleId('plugin.google.places.Plugin');

import Settings from '../../../os/config/settings.js';
import AbstractPlugin from '../../../os/plugin/abstractplugin.js';
import SearchManager from '../../../os/search/searchmanager.js';
import Search from './search.js';
import {ID} from './index.js';

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
