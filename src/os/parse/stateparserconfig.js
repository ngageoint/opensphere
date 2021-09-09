goog.module('os.parse.StateParserConfig');

const FileParserConfig = goog.require('os.parse.FileParserConfig');
const OSFile = goog.requireType('os.file.File');


/**
 * Configuration for a file parser.
 *
 * @extends {FileParserConfig<T>}
 * @unrestricted
 * @template T
 */
class StateParserConfig extends FileParserConfig {
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

exports = StateParserConfig;
