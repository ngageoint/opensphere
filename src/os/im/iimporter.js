goog.declareModuleId('os.im.IImporter');

const Listenable = goog.requireType('goog.events.Listenable');
const {default: IMapping} = goog.requireType('os.im.mapping.IMapping');
const {default: IParser} = goog.requireType('os.parse.IParser');


/**
 * Imports a set of items via a parser
 *
 * @extends {Listenable}
 * @interface
 * @template T
 */
export default class IImporter {
  /**
   * Gets the data
   * @param {boolean=} opt_reset Whether or not to reset the data as well. Defaults to <code>true</code>
   * @return {!Array<T>}
   */
  getData(opt_reset) {}

  /**
   * Get the parser used by the importer.
   * @return {IParser<T>}
   */
  getParser() {}

  /**
   * Stops the importer and clears its data
   */
  reset() {}

  /**
   * Starts the import
   * @param {Object|Array|string|Node|Document} source Source
   */
  startImport(source) {}

  /**
   * Stops the importer
   */
  stop() {}

  /**
   * Gettings the current mappings.
   * @return {?Array<IMapping>} The mappings or null
   */
  getMappings() {}

  /**
   * Set the mappings.
   * @param {?Array<IMapping>} value The mappings
   */
  setMappings(value) {}
}
