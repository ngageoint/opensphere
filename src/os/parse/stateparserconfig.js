goog.provide('os.parse.StateParserConfig');
goog.require('os.file.File');
goog.require('os.parse.FileParserConfig');



/**
 * Configuration for a file parser.
 * @extends {os.parse.FileParserConfig.<T>}
 * @param {os.file.File=} opt_file
 * @constructor
 * @template T
 */
os.parse.StateParserConfig = function(opt_file) {
  os.parse.StateParserConfig.base(this, 'constructor', opt_file);

  /**
   * The state items to load
   * @type {Array.<string>}
   */
  this['loadItems'] = null;

  /**
   * The state
   * @type {Document|Object.<string, *>}
   */
  this['state'] = null;
};
goog.inherits(os.parse.StateParserConfig, os.parse.FileParserConfig);
