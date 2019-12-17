goog.provide('plugin.file.zip.ZIPParserConfig');

goog.require('os.parse.FileParserConfig');
goog.require('os.ui.slick.column');
goog.require('plugin.file.zip.ZIPParser');



/**
 * Configuration for a ZIP parser.
 *
 * @extends {os.parse.FileParserConfig}
 * @constructor
 */
plugin.file.zip.ZIPParserConfig = function() {
  plugin.file.zip.ZIPParserConfig.base(this, 'constructor');

  /**
   * @type {number}
   */
  this['status'] = -1;

  /**
   * The destination where ZIPParser drops the unzipped files
   * @type {Array.<osx.import.FileWrapper>}
   */
  this['files'] = [];
};
goog.inherits(plugin.file.zip.ZIPParserConfig, os.parse.FileParserConfig);


/**
 * Helper function to clean up memory if the parser is taking too long, user cancels/abandons the thread, etc
 * @public
 */
plugin.file.zip.ZIPParserConfig.prototype.cleanup = function() {
  this['file'] = null;
  if (this['files'].length > 0) this['files'] = [];
  this['status'] = -1; // uninitialized state
};
