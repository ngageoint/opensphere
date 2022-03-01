goog.declareModuleId('plugin.georss.GeoRSSLayerConfig');

import DateTimeMapping from 'opensphere/src/os/im/mapping/time/datetimemapping.js';
import AbstractDataSourceLayerConfig from 'opensphere/src/os/layer/config/abstractdatasourcelayerconfig.js';

import GeoRSSParser from './georssparser.js';

/**
 * GeoRSS layer config.
 */
export default class GeoRSSLayerConfig extends AbstractDataSourceLayerConfig {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  getParser(options) {
    return new GeoRSSParser();
  }

  /**
   * @inheritDoc
   */
  getImporter(options) {
    const importer = super.getImporter(options);

    // Auto detect the time from the fields.
    // This should only be called for mappings not explicitly set by the user in
    // the import UI. See other file types for examples.
    importer.selectAutoMappings([DateTimeMapping.ID]);

    return importer;
  }
}
