goog.provide('os.ex.ExportOptions');


/**
 * @typedef {{
 *   exporter: (os.ex.IExportMethod|undefined),
 *   fields: Array.<string>,
 *   items: Array.<*>,
 *   persister: (os.ex.IPersistenceMethod|undefined),
 *   sources: (Array.<*>|undefined),
 *   title: (string|undefined)
 * }}
 */
os.ex.ExportOptions;
