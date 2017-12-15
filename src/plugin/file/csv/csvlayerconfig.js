goog.provide('plugin.file.csv.CSVLayerConfig');
goog.require('os.layer.config.AbstractDataSourceLayerConfig');
goog.require('plugin.file.csv.CSVParser');
goog.require('plugin.file.csv.CSVParserConfig');



/**
 * @extends {os.layer.config.AbstractDataSourceLayerConfig}
 * @constructor
 */
plugin.file.csv.CSVLayerConfig = function() {
  plugin.file.csv.CSVLayerConfig.base(this, 'constructor');

  /**
   * @type {plugin.file.csv.CSVParserConfig}
   * @protected
   */
  this.parserConfig = new plugin.file.csv.CSVParserConfig();
};
goog.inherits(plugin.file.csv.CSVLayerConfig, os.layer.config.AbstractDataSourceLayerConfig);


/**
 * @inheritDoc
 */
plugin.file.csv.CSVLayerConfig.prototype.initializeConfig = function(options) {
  plugin.file.csv.CSVLayerConfig.superClass_.initializeConfig.call(this, options);

  if (goog.isDefAndNotNull(options['parserConfig'])) {
    this.parserConfig = /** @type {plugin.file.csv.CSVParserConfig} */ (options['parserConfig']);
  } else {
    // when loading from a state file, these will be inline in the base options instead of in a parser config object
    if (goog.isDefAndNotNull(options['commentChar'])) {
      this.parserConfig['commentChar'] = options['commentChar'];
    }

    if (goog.isDefAndNotNull(options['dataRow'])) {
      this.parserConfig['dataRow'] = options['dataRow'];
    }

    if (goog.isDefAndNotNull(options['delimiter'])) {
      this.parserConfig['delimiter'] = options['delimiter'];
    }

    if (goog.isDefAndNotNull(options['headerRow'])) {
      this.parserConfig['headerRow'] = options['headerRow'];
    }

    if (goog.isDefAndNotNull(options['useHeader'])) {
      this.parserConfig['useHeader'] = options['useHeader'];
    }

    if (goog.isDefAndNotNull(options['mappings'])) {
      this.parserConfig['mappings'] = options['mappings'];
    }

    if (goog.isDefAndNotNull(options['skipTimeMappings'])) {
      this.parserConfig['skipTimeMappings'] = options['skipTimeMappings'];
    }

    if (goog.isDefAndNotNull(options['skipGeoMappings'])) {
      this.parserConfig['skipGeoMappings'] = options['skipGeoMappings'];
    }
  }
};


/**
 * @inheritDoc
 */
plugin.file.csv.CSVLayerConfig.prototype.getImporter = function(options) {
  var importer = plugin.file.csv.CSVLayerConfig.base(this, 'getImporter', options);
  // indicate the mappings we have already configured based on the user
  importer.setExecMappings(this.parserConfig['mappings']);
  return importer;
};


/**
 * @inheritDoc
 */
plugin.file.csv.CSVLayerConfig.prototype.getParser = function(options) {
  return new plugin.file.csv.CSVParser(this.parserConfig);
};
