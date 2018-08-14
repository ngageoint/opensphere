goog.provide('plugin.file.shp.SHPParserConfig');
goog.require('os.parse.FileParserConfig');
goog.require('os.ui.slick.column');
goog.require('plugin.file.shp');
goog.require('plugin.file.shp.SHPParser');



/**
 * Configuration for a SHP parser.
 * @extends {os.parse.FileParserConfig}
 * @constructor
 */
plugin.file.shp.SHPParserConfig = function() {
  plugin.file.shp.SHPParserConfig.base(this, 'constructor');

  /**
   * @type {os.file.File}
   */
  this['file2'] = null;

  /**
   * @type {os.file.File}
   */
  this['zipFile'] = null;

  /**
   * @type {number}
   */
  this['lineAlpha'] = plugin.file.shp.SHPParserConfig.DEFAULT_LINE_ALPHA;

  /**
   * @type {number}
   */
  this['fillAlpha'] = plugin.file.shp.SHPParserConfig.DEFAULT_FILL_ALPHA;

  /**
   * @type {number}
   */
  this['append'] = plugin.file.shp.SHPParserConfig.DEFAULT_APPEND;
};
goog.inherits(plugin.file.shp.SHPParserConfig, os.parse.FileParserConfig);


/**
 * @type {number}
 * @const
 */
plugin.file.shp.SHPParserConfig.DEFAULT_LINE_ALPHA = 1;


/**
 * @type {number}
 * @const
 */
plugin.file.shp.SHPParserConfig.DEFAULT_FILL_ALPHA = 0.5;


/**
 * @type {boolean}
 * @const
 */
plugin.file.shp.SHPParserConfig.DEFAULT_APPEND = true;


/**
 * @param {Function} callback
 */
plugin.file.shp.SHPParserConfig.prototype.updateZipPreview = function(callback) {
  this['columns'] = [];
  this['preview'] = [];
  var parser = new plugin.file.shp.SHPParser(this);
  parser.setSource(this['zipFile'].getContent());

  goog.events.listen(parser, os.events.EventType.COMPLETE, goog.bind(function() {
    this['preview'] = parser.parsePreview();
    this['columns'] = parser.getColumns() || [];

    for (var i = 0, n = this['columns'].length; i < n; i++) {
      var column = this['columns'][i];
      column['width'] = 0;
      os.ui.slick.column.autoSizeColumn(column);
    }

    callback();

    parser.dispose();
  }, this), false, this);
};


/**
 * @inheritDoc
 */
plugin.file.shp.SHPParserConfig.prototype.updatePreview = function(opt_mappings) {
  this['columns'] = [];
  this['preview'] = [];

  if (this['file'] || this['file2']) {
    var source = [];
    if (this['file']) {
      source.push(this['file'].getContent());
    }
    if (this['file2']) {
      source.push(this['file2'].getContent());
    }

    var parser = new plugin.file.shp.SHPParser(this);
    parser.setSource(source);

    this['preview'] = parser.parsePreview();
    this['columns'] = parser.getColumns() || [];

    for (var i = 0, n = this['columns'].length; i < n; i++) {
      var column = this['columns'][i];
      column['width'] = 0;
      os.ui.slick.column.autoSizeColumn(column);
    }

    parser.dispose();
  }
};
