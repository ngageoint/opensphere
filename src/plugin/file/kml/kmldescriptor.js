goog.provide('plugin.file.kml.KMLDescriptor');

goog.require('os.data.FileDescriptor');
goog.require('os.layer');
goog.require('os.layer.LayerType');
goog.require('os.style');
goog.require('os.ui.ControlType');
goog.require('plugin.file.kml.KMLProvider');



/**
 * KML file descriptor.
 * @extends {os.data.FileDescriptor}
 * @constructor
 */
plugin.file.kml.KMLDescriptor = function() {
  plugin.file.kml.KMLDescriptor.base(this, 'constructor');
  this.descriptorType = 'kml';
};
goog.inherits(plugin.file.kml.KMLDescriptor, os.data.FileDescriptor);


/**
 * @inheritDoc
 */
plugin.file.kml.KMLDescriptor.prototype.getType = function() {
  return os.layer.LayerType.FEATURES;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLDescriptor.prototype.getLayerOptions = function() {
  var options = plugin.file.kml.KMLDescriptor.base(this, 'getLayerOptions');
  options['type'] = 'KML';

  // allow resetting the layer color to the default
  options[os.ui.ControlType.COLOR] = os.ui.ColorControlType.PICKER_RESET;

  // show the option to replace feature colors with the layer color
  options[os.layer.LayerOption.SHOW_FORCE_COLOR] = true;

  return options;
};


/**
 * Creates a new descriptor from a parser configuration.
 * @param {!os.parse.FileParserConfig} config
 * @return {!plugin.file.kml.KMLDescriptor}
 */
plugin.file.kml.KMLDescriptor.createFromConfig = function(config) {
  var provider = plugin.file.kml.KMLProvider.getInstance();
  var descriptor = new plugin.file.kml.KMLDescriptor();
  os.data.FileDescriptor.createFromConfig(descriptor, provider, config);
  return descriptor;
};
