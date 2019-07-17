goog.provide('os.data.FileProvider');

goog.require('os.ui.data.DescriptorProvider');



/**
 * Generic file-based provider
 *
 * @abstract
 * @extends {os.ui.data.DescriptorProvider<!T>}
 * @template T
 * @constructor
 */
os.data.FileProvider = function() {
  os.data.FileProvider.base(this, 'constructor');
};
goog.inherits(os.data.FileProvider, os.ui.data.DescriptorProvider);


/**
 * @inheritDoc
 */
os.data.FileProvider.prototype.configure = function(config) {
  this.setId('file');
  this.setLabel('Files');

  os.data.FileProvider.base(this, 'configure', config);

  // this provider should not show up in the server manager
  this.listInServers = false;
};


/**
 * @inheritDoc
 */
os.data.FileProvider.prototype.getToolTip = function() {
  return 'Contains all ' + this.getId().toUpperCase() + ' files that have been imported into the application.';
};


/**
 * @inheritDoc
 */
os.data.FileProvider.prototype.getErrorMessage = function() {
  return null;
};
