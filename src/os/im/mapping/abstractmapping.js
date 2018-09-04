goog.provide('os.im.mapping.AbstractMapping');

goog.require('goog.dom.xml');
goog.require('os.IXmlPersistable');
goog.require('os.im.mapping');
goog.require('os.im.mapping.IMapping');
goog.require('os.xml');



/**
 * @implements {os.im.mapping.IMapping.<T, S>}
 * @implements {os.IXmlPersistable}
 * @template T,S
 * @constructor
 */
os.im.mapping.AbstractMapping = function() {
  /**
   * @type {string|undefined}
   * @protected
   */
  this.id = undefined;

  /**
   * The type attribute value for the root XML node.
   * @type {!string}
   */
  this.xmlType = 'AbstractMapping';
};


/**
 * @inheritDoc
 */
os.im.mapping.AbstractMapping.prototype.field = undefined;


/**
 * @inheritDoc
 */
os.im.mapping.AbstractMapping.prototype.ui = undefined;


/**
 * @inheritDoc
 */
os.im.mapping.AbstractMapping.prototype.warnings = undefined;


/**
 * @inheritDoc
 */
os.im.mapping.AbstractMapping.prototype.autoDetect = function(items) {
  return null;
};


/**
 * @inheritDoc
 */
os.im.mapping.AbstractMapping.prototype.getId = function() {
  return this.id;
};


/**
 * @inheritDoc
 */
os.im.mapping.AbstractMapping.prototype.getLabel = function() {
  return null;
};


/**
 * @inheritDoc
 */
os.im.mapping.AbstractMapping.prototype.getScore = function() {
  return 0;
};


/**
 * @inheritDoc
 */
os.im.mapping.AbstractMapping.prototype.getScoreType = function() {
  return os.im.mapping.DEFAULT_SCORETYPE;
};


/**
 * @inheritDoc
 */
os.im.mapping.AbstractMapping.prototype.getFieldsChanged = function() {
  return [this.field];
};


/**
 * @inheritDoc
 */
os.im.mapping.AbstractMapping.prototype.execute = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.im.mapping.AbstractMapping.prototype.testField = function(value) {
  return goog.isDefAndNotNull(value);
};


/**
 * @inheritDoc
 */
os.im.mapping.AbstractMapping.prototype.clone = function() {
  var other = new this.constructor();
  other.field = this.field;
  return other;
};


/**
 * @inheritDoc
 */
os.im.mapping.AbstractMapping.prototype.persist = function(opt_to) {
  opt_to = opt_to || {};

  opt_to['id'] = this.getId();
  opt_to['field'] = this.field;

  return opt_to;
};


/**
 * @inheritDoc
 */
os.im.mapping.AbstractMapping.prototype.restore = function(config) {
  this.field = config['field'];
};


/**
 * @inheritDoc
 */
os.im.mapping.AbstractMapping.prototype.toXml = function() {
  var mapping = os.xml.createElement('mapping', undefined, undefined, {
    'type': this.xmlType
  });

  os.xml.appendElement('field', mapping, os.im.mapping.localFieldToXmlField(this.field));

  return mapping;
};


/**
 * @inheritDoc
 */
os.im.mapping.AbstractMapping.prototype.fromXml = function(xml) {
  this.xmlType = xml.getAttribute('type');
  this.field = os.im.mapping.xmlFieldToLocalField(this.getXmlValue(xml, 'field'));
};


/**
 * Convert a string to a boolean
 * @param {string} input  An input string
 * @return {boolean} true if the string is 'true', false otherwise.
 */
os.im.mapping.AbstractMapping.prototype.toBoolean = function(input) {
  if ('true' === input) {
    return true;
  }
  return false;
};


/**
 * Safely extract from an xml Element the first value of the first tag
 * @param {!Element} xml The xml element
 * @param {string}  tagName The tag to look for.
 * @return {?string} The value if available. Null otherwise.
 */
os.im.mapping.AbstractMapping.prototype.getXmlValue = function(xml, tagName) {
  var list = xml.getElementsByTagName(tagName);
  if (list && list[0]) {
    return list[0].innerHTML;
  }
  return null;
};

