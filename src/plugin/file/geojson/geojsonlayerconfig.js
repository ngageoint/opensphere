goog.declareModuleId('plugin.file.geojson.GeoJSONLayerConfig');

import AltMapping from '../../../os/im/mapping/altmapping.js';
import OrientationMapping from '../../../os/im/mapping/orientationmapping.js';
import SemiMajorMapping from '../../../os/im/mapping/semimajormapping.js';
import SemiMinorMapping from '../../../os/im/mapping/semiminormapping.js';
import DateTimeMapping from '../../../os/im/mapping/time/datetimemapping.js';
import AbstractDataSourceLayerConfig from '../../../os/layer/config/abstractdatasourcelayerconfig.js';
import ImportManager from '../../../os/ui/im/importmanager.js';
import GeoJSONParserConfig from '../geojsonparserconfig.js';


/**
 */
export default class GeoJSONLayerConfig extends AbstractDataSourceLayerConfig {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {FileParserConfig}
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
