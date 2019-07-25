goog.provide('plugin.descriptor.facet.TagSplit');
goog.require('os.search.BaseFacet');



/**
 * @constructor
 * @extends {os.search.BaseFacet<!os.data.IDataDescriptor>}
 */
plugin.descriptor.facet.TagSplit = function() {
  plugin.descriptor.facet.TagSplit.base(this, 'constructor');
};
goog.inherits(plugin.descriptor.facet.TagSplit, os.search.BaseFacet);


/**
 * @inheritDoc
 */
plugin.descriptor.facet.TagSplit.prototype.load = function(item, facets) {
  var tags = item.getTags();

  if (tags) {
    for (var i = 0, n = tags.length; i < n; i++) {
      var tag = tags[i];

      if (tag) {
        var split = tag.split(/:/);

        if (split && split.length === 2) {
          os.search.BaseFacet.update(split[0], split[1], facets);
        }
      }
    }
  }
};


/**
 * @inheritDoc
 */
plugin.descriptor.facet.TagSplit.prototype.test = function(item, facets, results) {
  var tags = item.getTags();

  for (var cat in facets) {
    var values = facets[cat];
    os.search.BaseFacet.updateResults(cat, results);

    for (var i = 0, n = values.length; i < n; i++) {
      var value = cat + ':' + values[i];

      if (tags && tags.indexOf(value) > -1) {
        os.search.BaseFacet.updateResults(cat, results, 1);
      }
    }
  }
};
