goog.provide('plugin.file.geojson.GeoJSONLayerConfig');
goog.require('os.layer.config.AbstractDataSourceLayerConfig');
goog.require('os.ui.im.ImportManager');
goog.require('plugin.file.geojson.GeoJSONParser');
goog.require('plugin.file.geojson.GeoJSONParserConfig');



/**
 * @extends {os.layer.config.AbstractDataSourceLayerConfig}
 * @constructor
 */
plugin.file.geojson.GeoJSONLayerConfig = function() {
  plugin.file.geojson.GeoJSONLayerConfig.base(this, 'constructor');

  /**
   * @type {os.parse.FileParserConfig}
   * @protected
   */
  this.parserConfig = new plugin.file.geojson.GeoJSONParserConfig();
};
goog.inherits(plugin.file.geojson.GeoJSONLayerConfig, os.layer.config.AbstractDataSourceLayerConfig);


/**
 * @inheritDoc
 */
plugin.file.geojson.GeoJSONLayerConfig.prototype.initializeConfig = function(options) {
  plugin.file.geojson.GeoJSONLayerConfig.base(this, 'initializeConfig', options);
  this.parserConfig = options['parserConfig'] || new plugin.file.geojson.GeoJSONParserConfig();
};


/**
 * @inheritDoc
 */
plugin.file.geojson.GeoJSONLayerConfig.prototype.getImporter = function(options) {
  var importer = plugin.file.geojson.GeoJSONLayerConfig.base(this, 'getImporter', options);
  if (goog.isDefAndNotNull(this.parserConfig['mappings'])) {
    importer.setAutoMappings(this.parserConfig['mappings']);
  } else {
    // there was no user interaction, so default the mappings to a set the importer would have used
    importer.selectAutoMappings([os.im.mapping.AltMapping.ID, os.im.mapping.OrientationMapping.ID,
      os.im.mapping.SemiMajorMapping.ID, os.im.mapping.SemiMinorMapping.ID, os.im.mapping.time.DateTimeMapping.ID]);
  }
  return importer;
};


/**
 * @inheritDoc
 */
plugin.file.geojson.GeoJSONLayerConfig.prototype.getParser = function(options) {
  var im = os.ui.im.ImportManager.getInstance();
  return im.getParser('geojson');
};
