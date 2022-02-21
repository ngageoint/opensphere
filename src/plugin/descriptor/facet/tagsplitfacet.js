goog.declareModuleId('plugin.descriptor.facet.TagSplit');

import BaseFacet from '../../../os/search/basefacet.js';

/**
 * @extends {BaseFacet<!IDataDescriptor>}
 */
export default class TagSplit extends BaseFacet {
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
          var split = tag.split(/:/);

          if (split && split.length === 2) {
            BaseFacet.update(split[0], split[1], facets);
          }
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  test(item, facets, results) {
    var tags = item.getTags();

    for (var cat in facets) {
      var values = facets[cat];
      BaseFacet.updateResults(cat, results);

      for (var i = 0, n = values.length; i < n; i++) {
        var value = cat + ':' + values[i];

        if (tags && tags.indexOf(value) > -1) {
          BaseFacet.updateResults(cat, results, 1);
        }
      }
    }
  }
}
