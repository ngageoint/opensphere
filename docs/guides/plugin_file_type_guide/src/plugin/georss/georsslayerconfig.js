goog.declareModuleId('plugin.georss.GeoRSSLayerConfig');

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
}
