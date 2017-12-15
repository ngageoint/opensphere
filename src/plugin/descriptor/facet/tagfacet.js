goog.provide('plugin.descriptor.facet.Tag');
goog.require('plugin.descriptor.facet.BaseFacet');



/**
 * @constructor
 * @extends {plugin.descriptor.facet.BaseFacet}
 */
plugin.descriptor.facet.Tag = function() {
  plugin.descriptor.facet.Tag.base(this, 'constructor');
};
goog.inherits(plugin.descriptor.facet.Tag, plugin.descriptor.facet.BaseFacet);


/**
 * @inheritDoc
 */
plugin.descriptor.facet.Tag.prototype.load = function(descriptor, facets) {
  var tags = descriptor.getTags();

  if (tags) {
    for (var i = 0, n = tags.length; i < n; i++) {
      var tag = tags[i];

      if (tag) {
        plugin.descriptor.facet.BaseFacet.update('Tag', tag, facets);
      }
    }
  }
};


/**
 * @inheritDoc
 */
plugin.descriptor.facet.Tag.prototype.test = function(descriptor, facets, results) {
  var values = facets['Tag'];

  if (values) {
    plugin.descriptor.facet.BaseFacet.updateResults('Tag', results);

    var tags = descriptor.getTags();
    if (tags) {
      for (var i = 0, n = values.length; i < n; i++) {
        plugin.descriptor.facet.BaseFacet.updateResults('Tag', results, tags.indexOf(values[i]) > -1 ? 1 : 0);
      }
    }
  }
};
