goog.provide('plugin.file.gml.GMLLayerConfig');
goog.require('os.layer.config.AbstractDataSourceLayerConfig');
goog.require('os.ui.im.ImportManager');
goog.require('plugin.file.gml.GMLParser');
goog.require('plugin.file.gml.GMLParserConfig');



/**
 * @extends {os.layer.config.AbstractDataSourceLayerConfig}
 * @constructor
 */
plugin.file.gml.GMLLayerConfig = function() {
  plugin.file.gml.GMLLayerConfig.base(this, 'constructor');

  /**
   * @type {os.parse.FileParserConfig}
   * @protected
   */
  this.parserConfig = new plugin.file.gml.GMLParserConfig();
};
goog.inherits(plugin.file.gml.GMLLayerConfig, os.layer.config.AbstractDataSourceLayerConfig);


/**
 * @inheritDoc
 */
plugin.file.gml.GMLLayerConfig.prototype.initializeConfig = function(options) {
  plugin.file.gml.GMLLayerConfig.base(this, 'initializeConfig', options);
  this.parserConfig = options['parserConfig'] || new plugin.file.gml.GMLParserConfig();
};


/**
 * @inheritDoc
 */
plugin.file.gml.GMLLayerConfig.prototype.getImporter = function(options) {
  var importer = plugin.file.gml.GMLLayerConfig.base(this, 'getImporter', options);
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
plugin.file.gml.GMLLayerConfig.prototype.getParser = function(options) {
  var im = os.ui.im.ImportManager.getInstance();
  return im.getParser('gml');
};
