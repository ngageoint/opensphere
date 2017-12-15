goog.provide('os.im.action.FilterActionTypeMethod');

goog.require('os.file.type.AbstractXMLTypeMethod');
goog.require('os.im.action');


/**
 * Filter action file type method.
 * @extends {os.file.type.AbstractXMLTypeMethod}
 * @constructor
 */
os.im.action.FilterActionTypeMethod = function() {
  os.im.action.FilterActionTypeMethod.base(this, 'constructor');

  var xmlGroup = os.im.action.ImportActionManager.getInstance().xmlGroup;

  /**
   * The namespace regular expression.
   * @type {RegExp}
   * @protected
   */
  this.nsRegExp = new RegExp('/' + xmlGroup, 'i');

  /**
   * The root element regular expression.
   * @type {RegExp}
   * @protected
   */
  this.rootRegExp = new RegExp('^' + xmlGroup + '$', 'i');
};
goog.inherits(os.im.action.FilterActionTypeMethod, os.file.type.AbstractXMLTypeMethod);


/**
 * @inheritDoc
 */
os.im.action.FilterActionTypeMethod.prototype.getContentType = function() {
  return 'text/xml';
};


/**
 * @inheritDoc
 */
os.im.action.FilterActionTypeMethod.prototype.getPriority = function() {
  return 1;
};


/**
 * @inheritDoc
 */
os.im.action.FilterActionTypeMethod.prototype.getLayerType = function() {
  return os.im.action.ID;
};


/**
 * @inheritDoc
 */
os.im.action.FilterActionTypeMethod.prototype.getNSRegExp = function() {
  // We want something that wont match with states. Depend on the root reg expression instead
  return this.nsRegExp;
};


/**
 * @inheritDoc
 */
os.im.action.FilterActionTypeMethod.prototype.getRootRegExp = function() {
  return this.rootRegExp;
};
