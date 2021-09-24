goog.declareModuleId('plugin.file.geojson.GeoJSONLayerConfig');

import GeoJSONParserConfig from '../geojsonparserconfig.js';

const AltMapping = goog.require('os.im.mapping.AltMapping');
const OrientationMapping = goog.require('os.im.mapping.OrientationMapping');
const SemiMajorMapping = goog.require('os.im.mapping.SemiMajorMapping');
const SemiMinorMapping = goog.require('os.im.mapping.SemiMinorMapping');
const DateTimeMapping = goog.require('os.im.mapping.time.DateTimeMapping');

const FeatureImporter = goog.requireType('os.im.FeatureImporter');
const AbstractDataSourceLayerConfig = goog.require('os.layer.config.AbstractDataSourceLayerConfig');
const ImportManager = goog.require('os.ui.im.ImportManager');
const {default: GeoJSONParser} = goog.requireType('plugin.file.geojson.GeoJSONParser');

/**
 */
export default class GeoJSONLayerConfig extends AbstractDataSourceLayerConfig {
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
    const importer = /** @type {FeatureImporter} */ (super.getImporter(options));
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
    var parser = /** @type {GeoJSONParser} */ (im.getParser('geojson'));
    parser.setSourceId(this.id);
    return parser;
  }
}
