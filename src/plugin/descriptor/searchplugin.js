goog.declareModuleId('plugin.descriptor.SearchPlugin');

import DescriptorSearch from './descriptorsearch.js';

const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const SearchManager = goog.require('os.search.SearchManager');
const FacetedSearchCtrl = goog.require('os.ui.search.FacetedSearchCtrl');

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
