goog.provide('os.ex.AbstractExporter');
goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.ex.IExportMethod');
goog.require('os.thread.Thread');



/**
 * Base class for exporting content
 * @extends {goog.events.EventTarget}
 * @implements {os.ex.IExportMethod}
 * @constructor
 * @template T
 */
os.ex.AbstractExporter = function() {
  os.ex.AbstractExporter.base(this, 'constructor');

  /**
   * The fields to export
   * @type {Array.<string>}
   * @protected
   */
  this.fields = null;

  /**
   * The fields to export
   * @type {Array.<T>}
   * @protected
   */
  this.items = null;

  /**
   * The logger
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.ex.AbstractExporter.LOGGER_;

  /**
   * The exporter name
   * @type {?string}
   */
  this.name = null;

  /**
   * The output of the exporter
   * @type {Object|null|string}
   */
  this.output = null;
};
goog.inherits(os.ex.AbstractExporter, goog.events.EventTarget);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ex.AbstractExporter.LOGGER_ = goog.log.getLogger('os.ex.AbstractExporter');


/**
 * @inheritDoc
 */
os.ex.AbstractExporter.prototype.disposeInternal = function() {
  os.ex.AbstractExporter.base(this, 'disposeInternal');
  this.reset();
};


/**
 * @inheritDoc
 */
os.ex.AbstractExporter.prototype.isAsync = function() {
  return false;
};


/**
 * @inheritDoc
 */
os.ex.AbstractExporter.prototype.supportsMultiple = function() {
  return false;
};


/**
 * @inheritDoc
 */
os.ex.AbstractExporter.prototype.reset = function() {
  this.fields = null;
  this.items = null;
  this.output = null;
};


/**
 * @inheritDoc
 */
os.ex.AbstractExporter.prototype.getExtension = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.ex.AbstractExporter.prototype.setFields = function(fields) {
  this.fields = fields;
};


/**
 * @inheritDoc
 */
os.ex.AbstractExporter.prototype.setItems = function(items) {
  this.items = items;
};


/**
 * @inheritDoc
 */
os.ex.AbstractExporter.prototype.getLabel = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.ex.AbstractExporter.prototype.getMimeType = function() {
  return 'text/plain';
};


/**
 * @inheritDoc
 */
os.ex.AbstractExporter.prototype.getName = function() {
  return this.name;
};


/**
 * @inheritDoc
 */
os.ex.AbstractExporter.prototype.setName = function(name) {
  this.name = name;
};


/**
 * @inheritDoc
 */
os.ex.AbstractExporter.prototype.process = function() {};


/**
 * @inheritDoc
 */
os.ex.AbstractExporter.prototype.cancel = function() {};


/**
 * @inheritDoc
 */
os.ex.AbstractExporter.prototype.getOutput = function() {
  return this.output;
};


/**
 * @inheritDoc
 */
os.ex.AbstractExporter.prototype.getUI = function() {
  return null;
};


/**
 * @inheritDoc
 */
os.ex.AbstractExporter.prototype.supportsLabelExport = function() {
  return false;
};
