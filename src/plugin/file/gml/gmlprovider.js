goog.declareModuleId('plugin.file.gml.GMLProvider');

import FileProvider from '../../../os/data/fileprovider.js';


/**
 * GML file provider
 */
export default class GMLProvider extends FileProvider {
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
    this.setId('gml');
    this.setLabel('GML Files');
  }
}

goog.addSingletonGetter(GMLProvider);
