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
   * @type {Array.<any>}
   */
  this['files'] = [];
};
goog.inherits(plugin.file.zip.ZIPParserConfig, os.parse.FileParserConfig);


/**
 * @param {Function} callback
 */
plugin.file.zip.ZIPParserConfig.prototype.update = function(callback) {
  // re-initialize
  if (this['files'].length > 0) this['files'] = [];
  this['status'] = -1;

  var parser = new plugin.file.zip.ZIPParser(this);

  goog.events.listenOnce(parser, os.events.EventType.COMPLETE, goog.bind(function() {
    var files = parser.getFiles();
    if (files) {
      for (var i = 0; i < files.length; i++) this['files'].push(files[i]);
    }

    if (callback) callback();

    this['status'] = 0;

    parser.dispose();
  }, this), false, this);

  // tell the parser to start unzipping this file
  parser.setSource(this['file'].getContent());

  this['status'] = 1;
};
