goog.module('plugin.file.geojson.GeoJSONLayerConfig');
goog.module.declareLegacyNamespace();

const AltMapping = goog.require('os.im.mapping.AltMapping');
const OrientationMapping = goog.require('os.im.mapping.OrientationMapping');
const SemiMajorMapping = goog.require('os.im.mapping.SemiMajorMapping');
const SemiMinorMapping = goog.require('os.im.mapping.SemiMinorMapping');
const DateTimeMapping = goog.require('os.im.mapping.time.DateTimeMapping');

const AbstractDataSourceLayerConfig = goog.require('os.layer.config.AbstractDataSourceLayerConfig');
const ImportManager = goog.require('os.ui.im.ImportManager');
const GeoJSONParserConfig = goog.require('plugin.file.geojson.GeoJSONParserConfig');


/**
 */
class GeoJSONLayerConfig extends AbstractDataSourceLayerConfig {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {os.parse.FileParserConfig}
     * @protected
     */
    this.parserConfig = new GeoJSONParserConfig();
  }

  /**
   * @inheritDoc
   */
  initializeConfig(options) {
    super.initializeConfig(options);
    this.parserConfig = options['parserConfig'] || new GeoJSONParserConfig();
  }

  /**
   * @inheritDoc
   */
  getImporter(options) {
    var importer = super.getImporter(options);
    if (this.parserConfig['mappings'] == null || this.parserConfig['mappings'].length == 0) {
      // there was no user interaction, so default the mappings to a set the importer would have used
      importer.selectAutoMappings([
        AltMapping.ID,
        OrientationMapping.ID,
        SemiMajorMapping.ID,
        SemiMinorMapping.ID,
        DateTimeMapping.ID]);
    } else {
      // setAutoMappings() ignores manual configs (e.g. custom Datetime format) since it re-autodetects
      importer.setExecMappings(this.parserConfig['mappings']);
    }
    return importer;
  }

  /**
   * @inheritDoc
   */
  getParser(options) {
    var im = ImportManager.getInstance();
    var parser = im.getParser('geojson');
    parser.setSourceId(this.id);
    return parser;
  }
}

exports = GeoJSONLayerConfig;
