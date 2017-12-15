goog.provide('plugin.descriptor.facet.Type');
goog.require('plugin.descriptor.facet.BaseFacet');



/**
 * @constructor
 * @extends {plugin.descriptor.facet.BaseFacet}
 */
plugin.descriptor.facet.Type = function() {
  plugin.descriptor.facet.Type.base(this, 'constructor');
};
goog.inherits(plugin.descriptor.facet.Type, plugin.descriptor.facet.BaseFacet);


/**
 * @inheritDoc
 */
plugin.descriptor.facet.Type.prototype.transformsValue = function(category) {
  return category === 'Type';
};


/**
 * @inheritDoc
 */
plugin.descriptor.facet.Type.prototype.valueToLabel = function(value) {
  if (goog.string.endsWith(value, 's') && !goog.string.endsWith(value, 'es')) {
    return value.substring(0, value.length - 1);
  }

  return value;
};


/**
 * @inheritDoc
 */
plugin.descriptor.facet.Type.prototype.load = function(descriptor, facets) {
  var type = descriptor.getType();

  if (type) {
    plugin.descriptor.facet.BaseFacet.update('Type', type, facets);
  }
};


/**
 * @inheritDoc
 */
plugin.descriptor.facet.Type.prototype.test = function(descriptor, facets, results) {
  var values = facets['Type'];

  if (values) {
    var t = descriptor.getType();
    var x = t ? values.indexOf(t) : -1;
    plugin.descriptor.facet.BaseFacet.updateResults('Type', results, x > -1 ? 1 : 0);
  }
};
