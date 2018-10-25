goog.provide('os.ex.IExportMethod');
goog.require('goog.disposable.IDisposable');
goog.require('goog.events.Listenable');



/**
 * @interface
 * @extends {goog.disposable.IDisposable}
 * @extends {goog.events.Listenable}
 * @template T
 */
os.ex.IExportMethod = function() {};


/**
 * The file extension for this export type.
 * @return {string}
 */
os.ex.IExportMethod.prototype.getExtension;


/**
 * Set the item fields to export.
 * @param {Array.<string>} fields
 */
os.ex.IExportMethod.prototype.setFields;


/**
 * Set the items to export.
 * @param {Array.<T>} items
 */
os.ex.IExportMethod.prototype.setItems;


/**
 * The human readable label/title to display for this export type (e.g. 'CSV').
 * @return {string}
 */
os.ex.IExportMethod.prototype.getLabel;


/**
 * The mime type for this export type.
 * @return {string}
 */
os.ex.IExportMethod.prototype.getMimeType;


/**
 * Get the name of the export method.
 * @return {?string}
 */
os.ex.IExportMethod.prototype.getName;


/**
 * Set the name of the export method.
 * @param {string} name
 */
os.ex.IExportMethod.prototype.setName;


/**
 * If the exporter processes asynchronously.
 * @return {boolean}
 */
os.ex.IExportMethod.prototype.isAsync;


/**
 * If the export method supports exporting items from multiple data sources.
 * @return {boolean}
 */
os.ex.IExportMethod.prototype.supportsMultiple;


/**
 * Begins the export process.
 */
os.ex.IExportMethod.prototype.process;


/**
 * Cancel the export process.
 */
os.ex.IExportMethod.prototype.cancel;


/**
 * The resulting exported output.
 * @return {Object|null|string}
 */
os.ex.IExportMethod.prototype.getOutput;


/**
 * The export UI.
 * @return {?string}
 */
os.ex.IExportMethod.prototype.getUI;


/**
 * Resets the exporter to its default state.
 */
os.ex.IExportMethod.prototype.reset;


/**
 * Does this exporter include labels
 * @return {boolean}
 */
os.ex.IExportMethod.prototype.supportsLabelExport;
