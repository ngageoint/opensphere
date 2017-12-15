goog.provide('os.parse.FileParserConfig');
goog.require('os.file.File');
goog.require('os.parse.BaseParserConfig');



/**
 * Configuration for a file parser.
 * @extends {os.parse.BaseParserConfig.<T>}
 * @param {os.file.File=} opt_file
 * @constructor
 * @template T
 */
os.parse.FileParserConfig = function(opt_file) {
  os.parse.FileParserConfig.base(this, 'constructor');

  /**
   * The file to import
   * @type {?os.file.File}
   */
  this['file'] = opt_file || null;

  /**
   * If this file should replace another already in the application.
   * @type {boolean}
   */
  this['replace'] = false;
};
goog.inherits(os.parse.FileParserConfig, os.parse.BaseParserConfig);
