goog.provide('os.ui.im.FilterTypeMethod');
goog.require('os.file.type.AbstractXMLTypeMethod');


/**
 * @extends {os.file.type.AbstractXMLTypeMethod}
 * @constructor
 */
os.ui.im.FilterTypeMethod = function() {
  os.ui.im.FilterTypeMethod.base(this, 'constructor');
};
goog.inherits(os.ui.im.FilterTypeMethod, os.file.type.AbstractXMLTypeMethod);


/**
 * @inheritDoc
 */
os.ui.im.FilterTypeMethod.prototype.getContentType = function() {
  return 'text/xml; subtype=FILTER';
};


/**
 * @inheritDoc
 */
os.ui.im.FilterTypeMethod.prototype.getPriority = function() {
  return 1;
};


/**
 * @inheritDoc
 */
os.ui.im.FilterTypeMethod.prototype.getLayerType = function() {
  return 'FILTER';
};


/**
 * @inheritDoc
 */
os.ui.im.FilterTypeMethod.prototype.getNSRegExp = function() {
  // We want something that wont match with states. Depend on the root reg expression instead
  return /\/filters/i;
};


/**
 * @inheritDoc
 */
os.ui.im.FilterTypeMethod.prototype.getRootRegExp = function() {
  return /^filters$/i;
};
