goog.declareModuleId('plugin.pelias.geocoder.Plugin');

import settings from '../../../os/config/settings.js';
import AbstractPlugin from '../../../os/plugin/abstractplugin.js';
import SearchManager from '../../../os/search/searchmanager.js';
import {ID} from './geocoder.js';
import Search from './search.js';

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
