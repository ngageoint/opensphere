goog.module('plugin.descriptor.facet.Source');
goog.module.declareLegacyNamespace();

const BaseFacet = goog.require('os.search.BaseFacet');

const IDataDescriptor = goog.requireType('os.data.IDataDescriptor');


/**
 * @extends {BaseFacet<!IDataDescriptor>}
 */
class Source extends BaseFacet {
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

exports = Source;
