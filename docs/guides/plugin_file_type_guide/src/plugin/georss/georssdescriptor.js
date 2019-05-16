goog.provide('plugin.georss.GeoRSSDescriptor');

goog.require('os.data.FileDescriptor');
goog.require('os.layer');
goog.require('os.layer.LayerType');
goog.require('os.style');
goog.require('os.ui.ControlType');
goog.require('plugin.georss.GeoRSSProvider');


/**
 * GeoRSS file descriptor.
 * @extends {os.data.FileDescriptor}
 * @constructor
 */
plugin.georss.GeoRSSDescriptor = function() {
  plugin.georss.GeoRSSDescriptor.base(this, 'constructor');
  this.descriptorType = plugin.georss.ID;
};
goog.inherits(plugin.georss.GeoRSSDescriptor, os.data.FileDescriptor);


/**
 * @inheritDoc
 */
plugin.georss.GeoRSSDescriptor.prototype.getType = function() {
  return os.layer.LayerType.FEATURES;
};


/**
 * @inheritDoc
 */
plugin.georss.GeoRSSDescriptor.prototype.getLayerOptions = function() {
  var options = plugin.georss.GeoRSSDescriptor.base(this, 'getLayerOptions');
  options['type'] = plugin.georss.ID;

  // allow resetting the layer color to the default
  options[os.ui.ControlType.COLOR] = os.ui.ColorControlType.PICKER_RESET;
  return options;
};


/**
 * Creates a new descriptor from a parser configuration.
 * @param {!os.parse.FileParserConfig} config
 * @return {!plugin.georss.GeoRSSDescriptor}
 */
plugin.georss.GeoRSSDescriptor.createFromConfig = function(config) {
  return os.data.FileDescriptor.createFromConfig(new plugin.georss.GeoRSSDescriptor(config),
    plugin.georss.GeoRSSProvider.getInstance(), config, true);
};
