goog.declareModuleId('os.parse.StateParserConfig');

import FileParserConfig from './fileparserconfig.js';
const {default: OSFile} = goog.requireType('os.file.File');


/**
 * Configuration for a file parser.
 *
 * @extends {FileParserConfig<T>}
 * @unrestricted
 * @template T
 */
export default class StateParserConfig extends FileParserConfig {
  /**
   * Constructor.
   * @param {OSFile=} opt_file
   */
  constructor(opt_file) {
    super(opt_file);

    /**
     * The state items to load
     * @type {Array<string>}
     */
    this['loadItems'] = null;

    /**
     * The state
     * @type {Document|Object.<string, *>}
     */
    this['state'] = null;
  }
}
