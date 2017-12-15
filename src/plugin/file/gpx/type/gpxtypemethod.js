goog.provide('plugin.file.gpx.type.GPXTypeMethod');
goog.require('os.file.type.AbstractXMLTypeMethod');



/**
 * Type method for GPX content.
 * @extends {os.file.type.AbstractXMLTypeMethod}
 * @constructor
 */
plugin.file.gpx.type.GPXTypeMethod = function() {
  plugin.file.gpx.type.GPXTypeMethod.base(this, 'constructor');
};
goog.inherits(plugin.file.gpx.type.GPXTypeMethod, os.file.type.AbstractXMLTypeMethod);


/**
 * @inheritDoc
 */
plugin.file.gpx.type.GPXTypeMethod.prototype.getPriority = function() {
  return -25;
};


/**
 * @inheritDoc
 */
plugin.file.gpx.type.GPXTypeMethod.prototype.getContentType = function() {
  return 'application/xml';
};


/**
 * @inheritDoc
 */
plugin.file.gpx.type.GPXTypeMethod.prototype.getLayerType = function() {
  return 'GPX';
};


/**
 * @inheritDoc
 */
plugin.file.gpx.type.GPXTypeMethod.prototype.getNSRegExp = function() {
  return /\/gpx\//i;
};


/**
 * @inheritDoc
 */
plugin.file.gpx.type.GPXTypeMethod.prototype.getRootRegExp = function() {
  return /^(document|folder|gpx)$/i;
};
