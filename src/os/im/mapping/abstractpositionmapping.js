goog.provide('os.im.mapping.AbstractPositionMapping');

goog.require('os.im.mapping.AbstractMapping');
goog.require('os.xml');



/**
 * @extends {os.im.mapping.AbstractMapping}
 * @constructor
 */
os.im.mapping.AbstractPositionMapping = function() {
  os.im.mapping.AbstractPositionMapping.base(this, 'constructor');

  /**
   * Optional format string to override autodetect preferences
   * @type {string|undefined}
   */
  this.customFormat = undefined;
};
goog.inherits(os.im.mapping.AbstractPositionMapping, os.im.mapping.AbstractMapping);


/**
 * @inheritDoc
 */
os.im.mapping.AbstractPositionMapping.prototype.clone = function() {
  var other = os.im.mapping.AbstractPositionMapping.base(this, 'clone');
  other.customFormat = this.customFormat;
  return other;
};


/**
 * @inheritDoc
 */
os.im.mapping.AbstractPositionMapping.prototype.persist = function(opt_to) {
  opt_to = os.im.mapping.AbstractPositionMapping.base(this, 'persist', opt_to);
  opt_to['customFormat'] = this.customFormat;
  return opt_to;
};


/**
 * @inheritDoc
 */
os.im.mapping.AbstractPositionMapping.prototype.restore = function(config) {
  os.im.mapping.AbstractPositionMapping.base(this, 'restore', config);
  this.customFormat = config['customFormat'];
};


/**
 * @inheritDoc
 */
os.im.mapping.AbstractPositionMapping.prototype.toXml = function() {
  var xml = os.im.mapping.AbstractPositionMapping.base(this, 'toXml');
  os.xml.appendElement('customFormat', xml, os.im.mapping.localFieldToXmlField(this.customFormat || null));

  return xml;
};


/**
 * @inheritDoc
 */
os.im.mapping.AbstractPositionMapping.prototype.fromXml = function(xml) {
  os.im.mapping.AbstractPositionMapping.base(this, 'fromXml', xml);
  var customFormat = os.im.mapping.xmlFieldToLocalField(this.getXmlValue(xml, 'customFormat'));
  this.customFormat = /** @type {string|undefined} */ (customFormat ? customFormat : undefined);
};


/**
 * Tests if the mapping can be performed on the provided value
 * @param {string} value The field value to test
 * @param {string=} opt_format optional parsing format string
 * @return {?string} if a value can be parsed correctly return that value, otherwise null
 */
os.im.mapping.AbstractPositionMapping.prototype.testAndGetField = function(value, opt_format) {
  return this.testField(value) ? value : null;
};
