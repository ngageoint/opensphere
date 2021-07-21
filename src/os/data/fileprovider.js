goog.module('os.data.FileProvider');
goog.module.declareLegacyNamespace();

const DescriptorProvider = goog.require('os.ui.data.DescriptorProvider');


/**
 * Generic file-based provider
 *
 * @abstract
 * @extends {DescriptorProvider<!T>}
 * @template T
 */
class FileProvider extends DescriptorProvider {
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

exports = FileProvider;
