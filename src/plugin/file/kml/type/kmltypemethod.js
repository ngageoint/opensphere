goog.provide('plugin.file.kml.type.KMLTypeMethod');
goog.require('os.file.type.AbstractXMLTypeMethod');



/**
 * Type method for KML content.
 * @extends {os.file.type.AbstractXMLTypeMethod}
 * @constructor
 */
plugin.file.kml.type.KMLTypeMethod = function() {
  plugin.file.kml.type.KMLTypeMethod.base(this, 'constructor');
};
goog.inherits(plugin.file.kml.type.KMLTypeMethod, os.file.type.AbstractXMLTypeMethod);


/**
 * @inheritDoc
 */
plugin.file.kml.type.KMLTypeMethod.prototype.getContentType = function() {
  return 'application/vnd.google-earth.kml+xml';
};


/**
 * @inheritDoc
 */
plugin.file.kml.type.KMLTypeMethod.prototype.getLayerType = function() {
  return 'KML';
};


/**
 * @inheritDoc
 */
plugin.file.kml.type.KMLTypeMethod.prototype.getNSRegExp = function() {
  return /\/kml\//i;
};


/**
 * @inheritDoc
 */
plugin.file.kml.type.KMLTypeMethod.prototype.getRootRegExp = function() {
  return /^(document|folder|kml)$/i;
};
