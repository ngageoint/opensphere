goog.provide('plugin.file.geojson.GeoJSONDescriptor');
goog.require('os.data.FileDescriptor');
goog.require('os.layer.LayerType');
goog.require('plugin.file.geojson.GeoJSONParserConfig');
goog.require('plugin.file.geojson.GeoJSONProvider');



/**
 * GeoJSON file descriptor.
 * @param {plugin.file.geojson.GeoJSONParserConfig=} opt_config
 * @extends {os.data.FileDescriptor}
 * @constructor
 */
plugin.file.geojson.GeoJSONDescriptor = function(opt_config) {
  plugin.file.geojson.GeoJSONDescriptor.base(this, 'constructor');
  this.descriptorType = 'geojson';
  this.parserConfig = opt_config || new plugin.file.geojson.GeoJSONParserConfig();
};
goog.inherits(plugin.file.geojson.GeoJSONDescriptor, os.data.FileDescriptor);


/**
 * @inheritDoc
 */
plugin.file.geojson.GeoJSONDescriptor.prototype.getType = function() {
  return os.layer.LayerType.FEATURES;
};


/**
 * @inheritDoc
 */
plugin.file.geojson.GeoJSONDescriptor.prototype.getLayerOptions = function() {
  var options = plugin.file.geojson.GeoJSONDescriptor.base(this, 'getLayerOptions');
  options['type'] = 'GeoJSON';
  return options;
};


/**
 * Creates a new descriptor from a parser configuration.
 * @param {!plugin.file.geojson.GeoJSONParserConfig} config
 * @return {!plugin.file.geojson.GeoJSONDescriptor}
 */
plugin.file.geojson.GeoJSONDescriptor.createFromConfig = function(config) {
  var provider = plugin.file.geojson.GeoJSONProvider.getInstance();
  var descriptor = new plugin.file.geojson.GeoJSONDescriptor(config);
  os.data.FileDescriptor.createFromConfig(descriptor, provider, config);
  return descriptor;
};
