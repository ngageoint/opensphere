goog.module('plugin.descriptor.facet.Tag');
goog.module.declareLegacyNamespace();

const BaseFacet = goog.require('os.search.BaseFacet');


/**
 * @extends {BaseFacet<!os.data.IDataDescriptor>}
 */
class Tag extends BaseFacet {
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
    var tags = item.getTags();

    if (tags) {
      for (var i = 0, n = tags.length; i < n; i++) {
        var tag = tags[i];

        if (tag) {
          BaseFacet.update('Tag', tag, facets);
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  test(item, facets, results) {
    var values = facets['Tag'];

    if (values) {
      BaseFacet.updateResults('Tag', results);

      var tags = item.getTags();
      if (tags) {
        for (var i = 0, n = values.length; i < n; i++) {
          BaseFacet.updateResults('Tag', results, tags.indexOf(values[i]) > -1 ? 1 : 0);
        }
      }
    }
  }
}

exports = Tag;
