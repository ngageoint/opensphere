goog.declareModuleId('os.parse.FileParserConfig');

import BaseParserConfig from './baseparserconfig.js';
const {default: OSFile} = goog.requireType('os.file.File');


/**
 * Configuration for a file parser.
 *
 * @extends {BaseParserConfig<T>}
 * @unrestricted
 * @template T
 */
export default class FileParserConfig extends BaseParserConfig {
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
