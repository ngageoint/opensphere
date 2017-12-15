goog.provide('plugin.file.geojson.GeoJSONParserConfig');
goog.require('os.parse.FileParserConfig');
goog.require('os.ui.im.ImportManager');
goog.require('os.ui.slick.column');
goog.require('plugin.file.geojson.GeoJSONSimpleStyleParser');



/**
 * Configuration for a GeoJSON parser.
 * @extends {os.parse.FileParserConfig}
 * @constructor
 */
plugin.file.geojson.GeoJSONParserConfig = function() {
  plugin.file.geojson.GeoJSONParserConfig.base(this, 'constructor');
};
goog.inherits(plugin.file.geojson.GeoJSONParserConfig, os.parse.FileParserConfig);


/**
 * @inheritDoc
 */
plugin.file.geojson.GeoJSONParserConfig.prototype.updatePreview = function(opt_mappings) {
  var im = os.ui.im.ImportManager.getInstance();
  var parser = /** @type {plugin.file.geojson.GeoJSONParser} */ (im.getParser('geojson'));
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
