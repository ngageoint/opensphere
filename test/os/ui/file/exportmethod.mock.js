goog.provide('os.ui.file.MockExportMethod');
goog.require('os.ex.AbstractExporter');



/**
 * Mock export method for unit testing.
 * @extends {os.ex.AbstractExporter}
 * @constructor
 */
os.ui.file.MockExportMethod = function() {
  goog.base(this);
  this.cancelled = false;
  this.processed = false;
};
goog.inherits(os.ui.file.MockExportMethod, os.ex.AbstractExporter);


/**
 * @type {string}
 * @const
 */
os.ui.file.MockExportMethod.EXT = 'mex';


/**
 * @type {string}
 * @const
 */
os.ui.file.MockExportMethod.LABEL = 'Mock Exporter';


/**
 * @type {string}
 * @const
 */
os.ui.file.MockExportMethod.MIMETYPE = 'text/mock';


/**
 * The file extension for this export type.
 * @return {string}
 */
os.ui.file.MockExportMethod.prototype.getExtension = function() {
  return os.ui.file.MockExportMethod.EXT;
};


/**
 * The human readable label/title to display for this export type (e.g. 'CSV').
 * @return {string}
 */
os.ui.file.MockExportMethod.prototype.getLabel = function() {
  return os.ui.file.MockExportMethod.LABEL;
};


/**
 * The human readable label/title to display for this export type (e.g. 'CSV').
 * @return {string}
 */
os.ui.file.MockExportMethod.prototype.getMimeType = function() {
  return os.ui.file.MockExportMethod.MIMETYPE;
};


/**
 * Begins the export process.
 */
os.ui.file.MockExportMethod.prototype.process = function() {
  this.processed = true;
  this.output = this.items.join(' ');
};


/**
 * Cancel the export process.
 */
os.ui.file.MockExportMethod.prototype.cancel = function() {
  this.cancelled = true;
};


/**
 * Resets the exporter to its default state.
 */
os.ui.file.MockExportMethod.prototype.reset = function() {
  goog.base(this, 'reset');
  this.cancelled = false;
  this.processed = false;
};
