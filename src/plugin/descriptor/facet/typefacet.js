goog.provide('plugin.descriptor.facet.Type');

goog.require('os.search.ValueFacet');


/**
 * @constructor
 * @extends {os.search.ValueFacet<!os.data.IDataDescriptor>}
 */
plugin.descriptor.facet.Type = function() {
  plugin.descriptor.facet.Type.base(this, 'constructor', 'Type');
};
goog.inherits(plugin.descriptor.facet.Type, os.search.ValueFacet);


/**
 * @inheritDoc
 */
plugin.descriptor.facet.Type.prototype.getValue = function(item) {
  return item ? item.getType() : null;
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
