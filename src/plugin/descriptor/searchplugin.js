goog.module('plugin.descriptor.SearchPlugin');

const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const SearchManager = goog.require('os.search.SearchManager');
const FacetedSearchCtrl = goog.require('os.ui.search.FacetedSearchCtrl');
const DescriptorSearch = goog.require('plugin.descriptor.DescriptorSearch');


/**
 */
class SearchPlugin extends AbstractPlugin {
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


exports = SearchPlugin;
