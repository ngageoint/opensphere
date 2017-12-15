goog.provide('os.state.XMLStateTypeMethod');
goog.require('os.file.type.AbstractXMLTypeMethod');



/**
 * @extends {os.file.type.AbstractXMLTypeMethod}
 * @constructor
 */
os.state.XMLStateTypeMethod = function() {
  os.state.XMLStateTypeMethod.base(this, 'constructor');
};
goog.inherits(os.state.XMLStateTypeMethod, os.file.type.AbstractXMLTypeMethod);


/**
 * @inheritDoc
 */
os.state.XMLStateTypeMethod.prototype.getContentType = function() {
  return 'text/xml; subtype=STATE';
};


/**
 * @inheritDoc
 */
os.state.XMLStateTypeMethod.prototype.getLayerType = function() {
  return 'STATE';
};


/**
 * @inheritDoc
 */
os.state.XMLStateTypeMethod.prototype.getNSRegExp = function() {
  return /\/state/i;
};


/**
 * @inheritDoc
 */
os.state.XMLStateTypeMethod.prototype.getRootRegExp = function() {
  return /^state$/i;
};
