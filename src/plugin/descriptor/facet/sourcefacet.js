goog.provide('plugin.descriptor.facet.Source');
goog.require('plugin.descriptor.facet.BaseFacet');



/**
 * @constructor
 * @extends {plugin.descriptor.facet.BaseFacet}
 */
plugin.descriptor.facet.Source = function() {
  plugin.descriptor.facet.Source.base(this, 'constructor');
};
goog.inherits(plugin.descriptor.facet.Source, plugin.descriptor.facet.BaseFacet);


/**
 * @inheritDoc
 */
plugin.descriptor.facet.Source.prototype.load = function(descriptor, facets) {
  var source = descriptor.getProvider();

  if (source) {
    plugin.descriptor.facet.BaseFacet.update('Source', source, facets);
  }
};


/**
 * @inheritDoc
 */
plugin.descriptor.facet.Source.prototype.test = function(descriptor, facets, results) {
  var values = facets['Source'];

  if (values) {
    var p = descriptor.getProvider();
    var x = p ? values.indexOf(p) : -1;
    plugin.descriptor.facet.BaseFacet.updateResults('Source', results, x > -1 ? 1 : 0);
  }
};
