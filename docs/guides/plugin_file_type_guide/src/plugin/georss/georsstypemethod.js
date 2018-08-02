goog.provide('plugin.georss.GeoRSSTypeMethod');
goog.require('os.file.type.AbstractXMLTypeMethod');


/**
 * Type method for GeoRSS content.
 * @extends {os.file.type.AbstractXMLTypeMethod}
 * @constructor
 */
plugin.georss.GeoRSSTypeMethod = function() {
  plugin.georss.GeoRSSTypeMethod.base(this, 'constructor');
};
goog.inherits(plugin.georss.GeoRSSTypeMethod, os.file.type.AbstractXMLTypeMethod);


/**
 * @inheritDoc
 */
plugin.georss.GeoRSSTypeMethod.prototype.getLayerType = function() {
  return plugin.georss.ID;
};


// The parent class, by default, just checks the root XML namespace and the root
// tag name. These two functions provide RegExp instances for checking those.

/**
 * @inheritDoc
 */
plugin.georss.GeoRSSTypeMethod.prototype.getNSRegExp = function() {
  return /^http:\/\/www.w3.org\/2005\/Atom$/;
};


/**
 * @inheritDoc
 */
plugin.georss.GeoRSSTypeMethod.prototype.getRootRegExp = function() {
  return /^feed$/;
};

