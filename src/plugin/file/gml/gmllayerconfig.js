goog.declareModuleId('plugin.file.gml.GMLLayerConfig');

import AltMapping from '../../../os/im/mapping/altmapping.js';
import OrientationMapping from '../../../os/im/mapping/orientationmapping.js';
import SemiMajorMapping from '../../../os/im/mapping/semimajormapping.js';
import SemiMinorMapping from '../../../os/im/mapping/semiminormapping.js';
import DateTimeMapping from '../../../os/im/mapping/time/datetimemapping.js';
import AbstractDataSourceLayerConfig from '../../../os/layer/config/abstractdatasourcelayerconfig.js';
import ImportManager from '../../../os/ui/im/importmanager.js';
import GMLParserConfig from './gmlparserconfig.js';



/**
 */
export default class GMLLayerConfig extends AbstractDataSourceLayerConfig {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {FileParserConfig}
     * @protected
     */
    this.parserConfig = new GMLParserConfig();
  }

  /**
   * @inheritDoc
   */
  initializeConfig(options) {
    super.initializeConfig(options);
    this.parserConfig = options['parserConfig'] || new GMLParserConfig();
  }

  /**
   * @inheritDoc
   */
  getImporter(options) {
    const importer = /** @type {FeatureImporter} */ (super.getImporter(options));
    if (this.parserConfig['mappings'] != null && this.parserConfig['mappings'].length) {
      // setAutoMappings() ignores manual configs (e.g. custom Datetime format) since it re-autodetects
      importer.setExecMappings(this.parserConfig['mappings']);
    } else {
      // there was no user interaction, so default the mappings to a set the importer would have used
      importer.selectAutoMappings([
        AltMapping.ID,
        OrientationMapping.ID,
        SemiMajorMapping.ID,
        SemiMinorMapping.ID,
        DateTimeMapping.ID]);
    }
    return importer;
  }

  /**
   * @inheritDoc
   */
  getParser(options) {
    var im = ImportManager.getInstance();
    return im.getParser('gml');
  }
}
