goog.module('os.ex.IExportMethod');
goog.module.declareLegacyNamespace();

const IDisposable = goog.requireType('goog.disposable.IDisposable');
const Listenable = goog.requireType('goog.events.Listenable');

/**
 * @interface
 * @extends {IDisposable}
 * @extends {Listenable}
 * @template T
 */
class IExportMethod {
  /**
   * The file extension for this export type.
   * @return {string}
   */
  getExtension() {}

  /**
   * Set the item fields to export.
   * @param {Array.<string>} fields
   */
  setFields(fields) {}

  /**
   * Set the items to export.
   * @param {Array.<T>} items
   */
  setItems(items) {}

  /**
   * The human readable label/title to display for this export type (e.g. 'CSV').
   * @return {string}
   */
  getLabel() {}

  /**
   * The mime type for this export type.
   * @return {string}
   */
  getMimeType() {}

  /**
   * Get the name of the export method.
   * @return {?string}
   */
  getName() {}

  /**
   * Set the name of the export method.
   * @param {string} name
   */
  setName(name) {}

  /**
   * If the exporter processes asynchronously.
   * @return {boolean}
   */
  isAsync() {}

  /**
   * If the export method supports exporting items from multiple data sources.
   * @return {boolean}
   */
  supportsMultiple() {}

  /**
   * If the export method supports exporting time from the data source.
   * @return {boolean}
   */
  supportsTime() {}

  /**
   * Begins the export process.
   */
  process() {}

  /**
   * Cancel the export process.
   */
  cancel() {}

  /**
   * The resulting exported output.
   * @return {Object|null|string}
   */
  getOutput() {}

  /**
   * The export UI.
   * @return {?string}
   */
  getUI() {}

  /**
   * Resets the exporter to its default state.
   */
  reset() {}

  /**
   * Does this exporter include labels
   * @return {boolean}
   */
  supportsLabelExport() {}
}

exports = IExportMethod;
