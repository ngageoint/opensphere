goog.declareModuleId('plugin.file.geojson.GeoJSONProvider');

import FileProvider from '../../../os/data/fileprovider.js';


/**
 * GeoJSON file provider
 */
export default class GeoJSONProvider extends FileProvider {
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
    this.setId('geojson');
    this.setLabel('GeoJSON Files');
  }
}

goog.addSingletonGetter(GeoJSONProvider);
