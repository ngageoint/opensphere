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
   * @type {boolean}
   */
  this['parsing'] = null;

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
  this['files'].length = 0;
  this['parsing'] = true;

  var parser = new plugin.file.zip.ZIPParser(this);
  
  goog.events.listenOnce(parser, os.events.EventType.COMPLETE, goog.bind(function() {
    var files = parser.getFiles();
    if (files) {
        for (var i = 0; i < files.length; i++) this['files'].push(files[i]);
    }
    this['parsing'] = false;

    if (callback) callback();

    parser.dispose();
  }, this), false, this);

  parser.setSource(this['file'].getContent());

};
