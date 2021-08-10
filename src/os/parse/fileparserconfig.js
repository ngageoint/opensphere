goog.module('os.parse.FileParserConfig');
goog.module.declareLegacyNamespace();

const BaseParserConfig = goog.require('os.parse.BaseParserConfig');
const OSFile = goog.requireType('os.file.File');


/**
 * Configuration for a file parser.
 *
 * @extends {BaseParserConfig<T>}
 * @unrestricted
 * @template T
 */
class FileParserConfig extends BaseParserConfig {
  /**
   * Constructor.
   * @param {OSFile=} opt_file
   */
  constructor(opt_file) {
    super();

    /**
     * The file to import
     * @type {?OSFile}
     */
    this['file'] = opt_file || null;

    /**
     * If this file should replace another already in the application.
     * @type {boolean}
     */
    this['replace'] = false;
  }
}

exports = FileParserConfig;
