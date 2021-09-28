goog.declareModuleId('plugin.file.gpx.GPXProvider');

import FileProvider from '../../../os/data/fileprovider.js';


/**
 * GPX file provider
 */
export default class GPXProvider extends FileProvider {
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
    this.setId('gpx');
    this.setLabel('GPX Files');
  }
}

goog.addSingletonGetter(GPXProvider);
