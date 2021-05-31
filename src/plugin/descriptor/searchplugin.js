goog.module('plugin.descriptor.SearchPlugin');
goog.module.declareLegacyNamespace();

const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
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
      os.search.SearchManager.getInstance().registerSearch(new DescriptorSearch('Layers'));
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
