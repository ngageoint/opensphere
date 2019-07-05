goog.provide('plugin.file.gpx.GPXDescriptor');
goog.require('os.data.FileDescriptor');
goog.require('os.layer.LayerType');
goog.require('os.style');
goog.require('plugin.file.gpx.GPXProvider');



/**
 * GPX file descriptor.
 *
 * @extends {os.data.FileDescriptor}
 * @constructor
 */
plugin.file.gpx.GPXDescriptor = function() {
  plugin.file.gpx.GPXDescriptor.base(this, 'constructor');
  this.descriptorType = 'gpx';
};
goog.inherits(plugin.file.gpx.GPXDescriptor, os.data.FileDescriptor);


/**
 * @inheritDoc
 */
plugin.file.gpx.GPXDescriptor.prototype.getType = function() {
  return os.layer.LayerType.FEATURES;
};


/**
 * @inheritDoc
 */
plugin.file.gpx.GPXDescriptor.prototype.getLayerOptions = function() {
  var options = plugin.file.gpx.GPXDescriptor.base(this, 'getLayerOptions');
  options['type'] = 'GPX';
  return options;
};


/**
 * Creates a new descriptor from a parser configuration.
 *
 * @param {!os.parse.FileParserConfig} config
 * @return {!plugin.file.gpx.GPXDescriptor}
 */
plugin.file.gpx.GPXDescriptor.createFromConfig = function(config) {
  var provider = plugin.file.gpx.GPXProvider.getInstance();
  var descriptor = new plugin.file.gpx.GPXDescriptor();
  os.data.FileDescriptor.createFromConfig(descriptor, provider, config);
  return descriptor;
};
