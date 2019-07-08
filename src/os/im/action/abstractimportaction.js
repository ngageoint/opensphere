goog.provide('os.im.action.AbstractImportAction');

goog.require('os.im.action');
goog.require('os.im.action.IImportAction');
goog.require('os.object');
goog.require('os.xml');



/**
 * Abstract import action.
 *
 * @abstract
 * @implements {os.im.action.IImportAction<T>}
 * @constructor
 * @template T
 */
os.im.action.AbstractImportAction = function() {
  /**
   * The import action identifier.
   * @type {string}
   * @protected
   */
  this.id = '';

  /**
   * Unique identifier for this action.
   * @type {number}
   * @protected
   */
  this.uid = goog.getUid(this);

  /**
   * The label or title for the import action.
   * @type {string}
   * @protected
   */
  this.label = '';

  /**
   * The directive name for the import action configuration UI.
   * @type {string}
   * @protected
   */
  this.configUI = '';

  /**
   * If the action should be restricted to one use per entry.
   * @type {boolean}
   * @protected
   */
  this.unique = true;

  /**
   * The type attribute value for the root XML node.
   * @type {!string}
   */
  this.xmlType = os.im.action.AbstractImportAction.XML_TYPE;
};


/**
 * XML element name for the action.
 * @type {string}
 * @const
 */
os.im.action.AbstractImportAction.XML_TYPE = 'AbstractImportAction';


/**
 * @abstract
 * @inheritDoc
 */
os.im.action.AbstractImportAction.prototype.execute = function() {};


/**
 * @inheritDoc
 * @export
 */
os.im.action.AbstractImportAction.prototype.getId = function() {
  return this.id;
};


/**
 * @inheritDoc
 * @export
 */
os.im.action.AbstractImportAction.prototype.getLabel = function() {
  return this.label;
};


/**
 * @inheritDoc
 * @export
 */
os.im.action.AbstractImportAction.prototype.getConfigUI = function() {
  return this.configUI;
};


/**
 * @inheritDoc
 * @export
 */
os.im.action.AbstractImportAction.prototype.isUnique = function() {
  return this.unique;
};


/**
 * @inheritDoc
 */
os.im.action.AbstractImportAction.prototype.clone = function() {
  var other = new this.constructor();
  other.restore(this.persist());
  return other;
};


/**
 * @inheritDoc
 */
os.im.action.AbstractImportAction.prototype.persist = function(opt_to) {
  opt_to = opt_to || {};

  // save the id so the correct class can be created when restoring
  opt_to['id'] = this.id;

  return opt_to;
};


/**
 * @abstract
 * @inheritDoc
 */
os.im.action.AbstractImportAction.prototype.restore = function(config) {};


/**
 * @inheritDoc
 */
os.im.action.AbstractImportAction.prototype.toXml = function() {
  return os.xml.createElement(this.xmlType);
};


/**
 * @abstract
 * @inheritDoc
 */
os.im.action.AbstractImportAction.prototype.fromXml = function(xml) {};


/**
 * @abstract
 * @inheritDoc
 */
os.im.action.AbstractImportAction.prototype.reset = function(items) {};
