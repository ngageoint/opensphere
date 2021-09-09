goog.module('os.parse.csv.CsvParserConfig');

const FileParserConfig = goog.require('os.parse.FileParserConfig');
const {DEFAULT_COMMENT_CHAR, DEFAULT_DELIMITER} = goog.require('os.parse.csv');
const OSFile = goog.requireType('os.file.File');


/**
 * Parser config for CSV
 *
 * @extends {FileParserConfig<T>}
 * @unrestricted
 * @template T
 */
class CsvParserConfig extends FileParserConfig {
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

exports = CsvParserConfig;
