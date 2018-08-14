goog.provide('os.im.action.AbstractImportAction');

goog.require('os.im.action');
goog.require('os.im.action.IImportAction');
goog.require('os.object');
goog.require('os.xml');



/**
 * Abstract import action.
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
 * @inheritDoc
 */
os.im.action.AbstractImportAction.prototype.execute = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.im.action.AbstractImportAction.prototype.getId = function() {
  return this.id;
};
goog.exportProperty(
    os.im.action.AbstractImportAction.prototype,
    'getId',
    os.im.action.AbstractImportAction.prototype.getId);


/**
 * @inheritDoc
 */
os.im.action.AbstractImportAction.prototype.getLabel = function() {
  return this.label;
};
goog.exportProperty(
    os.im.action.AbstractImportAction.prototype,
    'getLabel',
    os.im.action.AbstractImportAction.prototype.getLabel);


/**
 * @inheritDoc
 */
os.im.action.AbstractImportAction.prototype.getConfigUI = function() {
  return this.configUI;
};
goog.exportProperty(
    os.im.action.AbstractImportAction.prototype,
    'getConfigUI',
    os.im.action.AbstractImportAction.prototype.getConfigUI);


/**
 * @inheritDoc
 */
os.im.action.AbstractImportAction.prototype.isUnique = function() {
  return this.unique;
};
goog.exportProperty(
    os.im.action.AbstractImportAction.prototype,
    'isUnique',
    os.im.action.AbstractImportAction.prototype.isUnique);


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
 * @inheritDoc
 */
os.im.action.AbstractImportAction.prototype.restore = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.im.action.AbstractImportAction.prototype.toXml = function() {
  return os.xml.createElement(this.xmlType);
};


/**
 * @inheritDoc
 */
os.im.action.AbstractImportAction.prototype.fromXml = goog.abstractMethod;
