goog.declareModuleId('plugin.file.csv.CSVLayerConfig');

import AbstractDataSourceLayerConfig from '../../../os/layer/config/abstractdatasourcelayerconfig.js';
import CSVParser from './csvparser.js';
import CSVParserConfig from './csvparserconfig.js';


/**
 */
export default class CSVLayerConfig extends AbstractDataSourceLayerConfig {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {CSVParserConfig}
     * @protected
     */
    this.parserConfig = new CSVParserConfig();
  }

  /**
   * @inheritDoc
   */
  initializeConfig(options) {
    super.initializeConfig(options);

    if (options['parserConfig'] != null) {
      this.parserConfig = /** @type {CSVParserConfig} */ (options['parserConfig']);
    } else {
      // when loading from a state file, these will be inline in the base options instead of in a parser config object
      if (options['commentChar'] != null) {
        this.parserConfig['commentChar'] = options['commentChar'];
      }

      if (options['dataRow'] != null) {
        this.parserConfig['dataRow'] = options['dataRow'];
      }

      if (options['delimiter'] != null) {
        this.parserConfig['delimiter'] = options['delimiter'];
      }

      if (options['headerRow'] != null) {
        this.parserConfig['headerRow'] = options['headerRow'];
      }

      if (options['useHeader'] != null) {
        this.parserConfig['useHeader'] = options['useHeader'];
      }

      if (options['mappings'] != null) {
        this.parserConfig['mappings'] = options['mappings'];
      }

      if (options['skipTimeMappings'] != null) {
        this.parserConfig['skipTimeMappings'] = options['skipTimeMappings'];
      }

      if (options['skipGeoMappings'] != null) {
        this.parserConfig['skipGeoMappings'] = options['skipGeoMappings'];
      }
    }
  }

  /**
   * @inheritDoc
   */
  getImporter(options) {
    var importer = /** @type {FeatureImporter} */ (super.getImporter(options));
    // indicate the mappings we have already configured based on the user
    importer.setExecMappings(this.parserConfig['mappings']);
    return importer;
  }

  /**
   * @inheritDoc
   */
  getParser(options) {
    return new CSVParser(this.parserConfig);
  }
}
