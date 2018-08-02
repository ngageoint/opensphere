goog.provide('plugin.file.gml.GMLTypeMethod');
goog.require('os.file.type.AbstractXMLTypeMethod');



/**
 * Type method for GML content.
 * @extends {os.file.type.AbstractXMLTypeMethod}
 * @constructor
 */
plugin.file.gml.GMLTypeMethod = function() {
  plugin.file.gml.GMLTypeMethod.base(this, 'constructor');
};
goog.inherits(plugin.file.gml.GMLTypeMethod, os.file.type.AbstractXMLTypeMethod);


/**
 * @inheritDoc
 */
plugin.file.gml.GMLTypeMethod.prototype.getContentType = function() {
  return 'application/gml+xml';
};


/**
 * @inheritDoc
 */
plugin.file.gml.GMLTypeMethod.prototype.getLayerType = function() {
  return 'GML';
};


/**
 * @inheritDoc
 */
plugin.file.gml.GMLTypeMethod.prototype.getNSRegExp = function() {
  return /\/(gml|wfs)/i;
};


/**
 * @inheritDoc
 */
plugin.file.gml.GMLTypeMethod.prototype.getRootRegExp = function() {
  return /^(gml|wfs)$/i;
};
