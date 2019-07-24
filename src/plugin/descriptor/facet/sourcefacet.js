goog.provide('plugin.descriptor.facet.Source');
goog.require('os.search.BaseFacet');



/**
 * @constructor
 * @extends {os.search.BaseFacet<!os.data.IDataDescriptor>}
 */
plugin.descriptor.facet.Source = function() {
  plugin.descriptor.facet.Source.base(this, 'constructor');
};
goog.inherits(plugin.descriptor.facet.Source, os.search.BaseFacet);


/**
 * @inheritDoc
 */
plugin.descriptor.facet.Source.prototype.load = function(item, facets) {
  var source = item.getProvider();

  if (source) {
    os.search.BaseFacet.update('Source', source, facets);
  }
};


/**
 * @inheritDoc
 */
plugin.descriptor.facet.Source.prototype.test = function(item, facets, results) {
  var values = facets['Source'];

  if (values) {
    var p = item.getProvider();
    var x = p ? values.indexOf(p) : -1;
    os.search.BaseFacet.updateResults('Source', results, x > -1 ? 1 : 0);
  }
};
