goog.provide('plugin.descriptor.facet.Tag');
goog.require('os.search.BaseFacet');



/**
 * @constructor
 * @extends {os.search.BaseFacet<!os.data.IDataDescriptor>}
 */
plugin.descriptor.facet.Tag = function() {
  plugin.descriptor.facet.Tag.base(this, 'constructor');
};
goog.inherits(plugin.descriptor.facet.Tag, os.search.BaseFacet);


/**
 * @inheritDoc
 */
plugin.descriptor.facet.Tag.prototype.load = function(item, facets) {
  var tags = item.getTags();

  if (tags) {
    for (var i = 0, n = tags.length; i < n; i++) {
      var tag = tags[i];

      if (tag) {
        os.search.BaseFacet.update('Tag', tag, facets);
      }
    }
  }
};


/**
 * @inheritDoc
 */
plugin.descriptor.facet.Tag.prototype.test = function(item, facets, results) {
  var values = facets['Tag'];

  if (values) {
    os.search.BaseFacet.updateResults('Tag', results);

    var tags = item.getTags();
    if (tags) {
      for (var i = 0, n = values.length; i < n; i++) {
        os.search.BaseFacet.updateResults('Tag', results, tags.indexOf(values[i]) > -1 ? 1 : 0);
      }
    }
  }
};
