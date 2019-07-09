goog.provide('plugin.descriptor.facet.Type');
goog.require('os.search.BaseFacet');



/**
 * @constructor
 * @extends {os.search.BaseFacet<!os.data.IDataDescriptor>}
 */
plugin.descriptor.facet.Type = function() {
  plugin.descriptor.facet.Type.base(this, 'constructor');
};
goog.inherits(plugin.descriptor.facet.Type, os.search.BaseFacet);


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
plugin.descriptor.facet.Type.prototype.load = function(item, facets) {
  var type = item.getType();

  if (type) {
    os.search.BaseFacet.update('Type', type, facets);
  }
};


/**
 * @inheritDoc
 */
plugin.descriptor.facet.Type.prototype.test = function(item, facets, results) {
  var values = facets['Type'];

  if (values) {
    var t = item.getType();
    var x = t ? values.indexOf(t) : -1;
    os.search.BaseFacet.updateResults('Type', results, x > -1 ? 1 : 0);
  }
};
