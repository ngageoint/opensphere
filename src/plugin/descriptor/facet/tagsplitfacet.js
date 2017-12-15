goog.provide('plugin.descriptor.facet.TagSplit');
goog.require('plugin.descriptor.facet.BaseFacet');



/**
 * @constructor
 * @extends {plugin.descriptor.facet.BaseFacet}
 */
plugin.descriptor.facet.TagSplit = function() {
  plugin.descriptor.facet.TagSplit.base(this, 'constructor');
};
goog.inherits(plugin.descriptor.facet.TagSplit, plugin.descriptor.facet.BaseFacet);


/**
 * @inheritDoc
 */
plugin.descriptor.facet.TagSplit.prototype.load = function(descriptor, facets) {
  var tags = descriptor.getTags();

  if (tags) {
    for (var i = 0, n = tags.length; i < n; i++) {
      var tag = tags[i];

      if (tag) {
        var split = tag.split(/:/);

        if (split && split.length === 2) {
          plugin.descriptor.facet.BaseFacet.update(split[0], split[1], facets);
        }
      }
    }
  }
};


/**
 * @inheritDoc
 */
plugin.descriptor.facet.TagSplit.prototype.test = function(descriptor, facets, results) {
  var tags = descriptor.getTags();

  for (var cat in facets) {
    var values = facets[cat];
    plugin.descriptor.facet.BaseFacet.updateResults(cat, results);

    for (var i = 0, n = values.length; i < n; i++) {
      var value = cat + ':' + values[i];

      if (tags && tags.indexOf(value) > -1) {
        plugin.descriptor.facet.BaseFacet.updateResults(cat, results, 1);
      }
    }
  }
};
