goog.declareModuleId('os.data.FileProvider');

import DescriptorProvider from '../ui/data/descriptorprovider.js';


/**
 * Generic file-based provider
 *
 * @abstract
 * @extends {DescriptorProvider<!T>}
 * @template T
 */
export default class FileProvider extends DescriptorProvider {
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
    this.setId('file');
    this.setLabel('Files');

    super.configure(config);

    // this provider should not show up in the server manager
    this.listInServers = false;
  }

  /**
   * @inheritDoc
   */
  getToolTip() {
    return 'Contains all ' + this.getId().toUpperCase() + ' files that have been imported into the application.';
  }

  /**
   * @inheritDoc
   */
  getErrorMessage() {
    return null;
  }
}
