goog.provide('os.parse.csv.CsvParserConfig');
goog.require('os.file.File');
goog.require('os.parse.FileParserConfig');
goog.require('os.parse.csv');



/**
 * Parser config for CSV
 * @extends {os.parse.FileParserConfig.<T>}
 * @template T
 * @param {os.file.File=} opt_file
 * @constructor
 */
os.parse.csv.CsvParserConfig = function(opt_file) {
  os.parse.csv.CsvParserConfig.base(this, 'constructor', opt_file);

  /**
   * @type {string}
   */
  this['commentChar'] = os.parse.csv.DEFAULT_COMMENT_CHAR;

  /**
   * @type {number}
   */
  this['dataRow'] = 2;

  /**
   * @type {string}
   */
  this['delimiter'] = os.parse.csv.DEFAULT_DELIMITER;

  /**
   * @type {number}
   */
  this['headerRow'] = 1;

  /**
   * @type {Array.<string>}
   */
  this['linePreview'] = [];

  /**
   * @type {boolean}
   */
  this['useHeader'] = true;
};
goog.inherits(os.parse.csv.CsvParserConfig, os.parse.FileParserConfig);


/**
 * Updates the unparsed line preview.
 */
os.parse.csv.CsvParserConfig.prototype.updateLinePreview = function() {
  this['linePreview'] = [];

  if (this['file']) {
    var content = /** @type {string} */ (this['file'].getContent());
    if (content) {
      var preview = content.split(/\r?\n/, 50);

      // only include non-empty lines
      for (var i = 0, n = preview.length; i < n; i++) {
        var line = goog.string.trim(preview[i]);
        if (line) {
          this['linePreview'].push(line);
        }
      }
    }
  }
};
