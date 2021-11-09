goog.declareModuleId('os.parse.csv.CsvParserConfig');

import FileParserConfig from '../fileparserconfig.js';
import {DEFAULT_COMMENT_CHAR, DEFAULT_DELIMITER} from './csv.js';
const {default: OSFile} = goog.requireType('os.file.File');


/**
 * Parser config for CSV
 *
 * @extends {FileParserConfig<T>}
 * @unrestricted
 * @template T
 */
export default class CsvParserConfig extends FileParserConfig {
  /**
   * Constructor.
   * @param {OSFile=} opt_file
   */
  constructor(opt_file) {
    super(opt_file);

    /**
     * @type {string}
     */
    this['commentChar'] = DEFAULT_COMMENT_CHAR;

    /**
     * @type {number}
     */
    this['dataRow'] = 2;

    /**
     * @type {string}
     */
    this['delimiter'] = DEFAULT_DELIMITER;

    /**
     * @type {number}
     */
    this['headerRow'] = 1;

    /**
     * @type {Array<string>}
     */
    this['linePreview'] = [];

    /**
     * @type {boolean}
     */
    this['useHeader'] = true;
  }

  /**
   * @inheritDoc
   */
  clearPreview() {
    super.clearPreview();
    this['linePreview'] = [];
  }

  /**
   * Updates the unparsed line preview.
   */
  updateLinePreview() {
    this['linePreview'] = [];

    if (this['file']) {
      var content = /** @type {string} */ (this['file'].getContent());
      if (content) {
        var preview = content.split(/\r?\n/, 50);

        // only include non-empty lines
        for (var i = 0, n = preview.length; i < n; i++) {
          var line = preview[i].trim();
          if (line) {
            this['linePreview'].push(line);
          }
        }
      }
    }
  }
}
