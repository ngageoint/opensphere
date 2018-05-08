goog.provide('plugin.file.gml.GMLParserConfig');
goog.require('os.parse.FileParserConfig');
goog.require('os.ui.im.ImportManager');
goog.require('os.ui.slick.column');



/**
 * Configuration for a GML parser.
 * @extends {os.parse.FileParserConfig}
 * @constructor
 */
plugin.file.gml.GMLParserConfig = function() {
  plugin.file.gml.GMLParserConfig.base(this, 'constructor');
};
goog.inherits(plugin.file.gml.GMLParserConfig, os.parse.FileParserConfig);


/**
 * @inheritDoc
 */
plugin.file.gml.GMLParserConfig.prototype.updatePreview = function(opt_mappings) {
  var im = os.ui.im.ImportManager.getInstance();
  var parser = /** @type {plugin.file.gml.GMLParser} */ (im.getParser('gml'));
  var features = parser.parsePreview(this['file'].getContent(), opt_mappings);

  this['preview'] = features || [];
  this['columns'] = parser.getColumns() || [];

  for (var i = 0, n = this['columns'].length; i < n; i++) {
    var column = this['columns'][i];
    column['width'] = 0;
    os.ui.slick.column.autoSizeColumn(column);
  }

  parser.dispose();
};
