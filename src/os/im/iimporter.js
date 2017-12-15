goog.provide('os.im.IImporter');
goog.require('goog.events.Listenable');
goog.require('os.parse.IParser');



/**
 * Imports a set of items via a parser
 * @extends {goog.events.Listenable}
 * @interface
 * @template T
 */
os.im.IImporter = function() {};


/**
 * Gets the data
 * @param {boolean=} opt_reset Whether or not to reset the data as well. Defaults to <code>true</code>
 * @return {!Array<T>}
 */
os.im.IImporter.prototype.getData;


/**
 * Get the parser used by the importer.
 * @return {os.parse.IParser<T>}
 */
os.im.IImporter.prototype.getParser;


/**
 * Stops the importer and clears its data
 */
os.im.IImporter.prototype.reset;


/**
 * Starts the import
 * @param {Object|Array|string|Node|Document} source Source
 */
os.im.IImporter.prototype.startImport;


/**
 * Stops the importer
 */
os.im.IImporter.prototype.stop;


/**
 * Gettings the current mappings.
 * @return {?Array<os.im.mapping.IMapping>} The mappings or null
 */
os.im.IImporter.prototype.getMappings;


/**
 * Set the mappings.
 * @param {?Array<os.im.mapping.IMapping>} value The mappings
 */
os.im.IImporter.prototype.setMappings;
