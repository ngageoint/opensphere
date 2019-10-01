goog.provide('plugin.file.zip.ZIPDescriptor');

goog.require('os.data.FileDescriptor');
goog.require('os.file.FileStorage');
goog.require('os.layer.LayerType');
goog.require('plugin.file.zip.ZIPParserConfig');
goog.require('plugin.file.zip.ZIPProvider');



/**
 * ZIP file descriptor.
 *
 * @extends {os.data.FileDescriptor}
 * @constructor
 */
plugin.file.zip.ZIPDescriptor = function() {
  plugin.file.zip.ZIPDescriptor.base(this, 'constructor');
  this.descriptorType = 'zip';
};


goog.inherits(plugin.file.zip.ZIPDescriptor, os.data.FileDescriptor);


/**
 * @inheritDoc
 */
plugin.file.zip.ZIPDescriptor.prototype.getType = function() {
  return os.layer.LayerType.FEATURES;
};


/**
 * Creates a new descriptor from a parser configuration.
 *
 * @param {!plugin.file.zip.ZIPParserConfig} config
 * @return {!plugin.file.zip.ZIPDescriptor}
 */
plugin.file.zip.ZIPDescriptor.createFromConfig = function(config) {
  var provider = plugin.file.zip.ZIPProvider.getInstance();
  var descriptor = new plugin.file.zip.ZIPDescriptor();
  os.data.FileDescriptor.createFromConfig(descriptor, provider, config);

  descriptor.updateFromConfig(config);
  return descriptor;
};
