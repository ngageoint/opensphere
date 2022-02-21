goog.declareModuleId('plugin.descriptor.facet.Source');

import BaseFacet from '../../../os/search/basefacet.js';

/**
 * @extends {BaseFacet<!IDataDescriptor>}
 */
export default class Source extends BaseFacet {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  load(item, facets) {
    var source = item.getProvider();

    if (source) {
      BaseFacet.update('Source', source, facets);
    }
  }

  /**
   * @inheritDoc
   */
  test(item, facets, results) {
    var values = facets['Source'];

    if (values) {
      var p = item.getProvider();
      var x = p ? values.indexOf(p) : -1;
      BaseFacet.updateResults('Source', results, x > -1 ? 1 : 0);
    }
  }
}
