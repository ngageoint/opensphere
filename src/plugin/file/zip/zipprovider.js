goog.provide('plugin.file.zip.ZIPProvider');

goog.require('os.data.FileProvider');


/**
 * ZIP file provider
 *
 * @extends {os.data.FileProvider}
 * @constructor
 */
plugin.file.zip.ZIPProvider = function() {
  plugin.file.zip.ZIPProvider.base(this, 'constructor');
};


goog.inherits(plugin.file.zip.ZIPProvider, os.data.FileProvider);
goog.addSingletonGetter(plugin.file.zip.ZIPProvider);


/**
 * @inheritDoc
 */
plugin.file.zip.ZIPProvider.prototype.configure = function(config) {
  plugin.file.zip.ZIPProvider.base(this, 'configure', config);
  this.setId('zip');
  this.setLabel('ZIP Files');
};
