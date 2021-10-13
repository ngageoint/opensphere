goog.declareModuleId('plugin.georss.GeoRSSLayerConfig');

import DateTimeMapping from 'opensphere/src/os/im/mapping/time/datetimemapping.js';
import TimeType from 'opensphere/src/os/im/mapping/timetype.js';
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

    // add time mapping to importer
    const timeMapping = new DateTimeMapping(TimeType.INSTANT);
    timeMapping.field = 'updated';
    // there's no need to call timeMapping.setFormat() since the default is what we want

    importer.setExecMappings([timeMapping]);
    return importer;
  }
}
