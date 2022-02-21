goog.declareModuleId('plugin.file.shp.SHPProvider');

import FileProvider from '../../../os/data/fileprovider.js';


/**
 * SHP file provider
 */
export default class SHPProvider extends FileProvider {
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
    this.setId('shp');
    this.setLabel('SHP Files');
  }
}

goog.addSingletonGetter(SHPProvider);
