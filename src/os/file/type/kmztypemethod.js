goog.provide('os.file.type.KMZTypeMethod');
goog.require('os.file.type.AbstractContainerTypeMethod');



/**
 * Generic type method for container types (i.e. zip) content.
 * @extends {os.file.type.AbstractContainerTypeMethod}
 * @constructor
 */
os.file.type.KMZTypeMethod = function() {};
goog.inherits(os.file.type.KMZTypeMethod, os.file.type.AbstractContainerTypeMethod);


/**
 * @inheritDoc
 */
os.file.type.KMZTypeMethod.prototype.getContentType = function() {
  return 'application/vnd.google-earth.kmz';
};


/**
 * @inheritDoc
 */
os.file.type.KMZTypeMethod.prototype.getLayerType = function() {
  return 'KML';
};


/**
 * @inheritDoc
 */
os.file.type.KMZTypeMethod.prototype.getPriority = function() {
  return 0;
};


/**
 * @inheritDoc
 */
os.file.type.KMZTypeMethod.prototype.getFileNameRegex = function() {
  return /\.kml$/i;
};
