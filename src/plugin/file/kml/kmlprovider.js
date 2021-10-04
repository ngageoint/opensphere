goog.declareModuleId('plugin.file.kml.KMLProvider');

import FileProvider from '../../../os/data/fileprovider.js';


/**
 * KML file provider
 */
export default class KMLProvider extends FileProvider {
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
    this.setId('kml');
    this.setLabel('KML Files');
  }
}

goog.addSingletonGetter(KMLProvider);
