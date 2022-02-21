goog.declareModuleId('plugin.descriptor.SearchPlugin');

import AbstractPlugin from '../../os/plugin/abstractplugin.js';
import SearchManager from '../../os/search/searchmanager.js';
import FacetedSearchCtrl from '../../os/ui/search/facetedsearch.js';
import DescriptorSearch from './descriptorsearch.js';


/**
 */
export default class SearchPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = SearchPlugin.ID;
  }

  /**
   * @inheritDoc
   */
  init() {
    if (!FacetedSearchCtrl.provider) {
      SearchManager.getInstance().registerSearch(new DescriptorSearch('Layers'));
      FacetedSearchCtrl.provider = new DescriptorSearch('Layers');
    }
  }
}

/**
 * @type {string}
 * @const
 */
SearchPlugin.ID = 'descriptorsearch';
