goog.declareModuleId('plugin.georss.GeoRSSProvider');

import FileProvider from 'opensphere/src/os/data/fileprovider.js';
import {ID} from './georss.js';


/**
 * GeoRSS file provider.
 */
export default class GeoRSSProvider extends FileProvider {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  configure(config) {
    super.configure(config);
    this.setId(ID);
    this.setLabel('GeoRSS Files');
  }

  /**
   * Get the global instance.
   * @return {!GeoRSSProvider}
   * @export
   */
  static getInstance() {
    if (!instance) {
      instance = new GeoRSSProvider();
    }

    return instance;
  }
}

/**
 * Global instance.
 * @type {GeoRSSProvider|undefined}
 */
let instance;
