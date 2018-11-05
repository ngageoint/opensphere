goog.provide('plugin.cesium.tiles.Descriptor');

goog.require('os.data.FileDescriptor');
goog.require('plugin.cesium.tiles.Provider');


/**
 * Cesium 3D tiles descriptor.
 * @extends {os.data.FileDescriptor}
 * @constructor
 */
plugin.cesium.tiles.Descriptor = function() {
  plugin.cesium.tiles.Descriptor.base(this, 'constructor');
  this.descriptorType = plugin.cesium.tiles.ID;
};
goog.inherits(plugin.cesium.tiles.Descriptor, os.data.FileDescriptor);


/**
 * @inheritDoc
 */
plugin.cesium.tiles.Descriptor.prototype.getIcons = function() {
  return plugin.cesium.tiles.ICON;
};


/**
 * @inheritDoc
 */
plugin.cesium.tiles.Descriptor.prototype.getLayerOptions = function() {
  var options = plugin.cesium.tiles.Descriptor.base(this, 'getLayerOptions');
  options['type'] = plugin.cesium.tiles.ID;

  // disable the color picker
  options[os.ui.ControlType.COLOR] = os.ui.ColorControlType.NONE;

  return options;
};


/**
 * Creates a new descriptor from a parser configuration.
 * @param {!Object} config
 * @return {!plugin.cesium.tiles.Descriptor}
 */
plugin.cesium.tiles.Descriptor.createFromConfig = function(config) {
  var file = config['file'];
  var provider = plugin.cesium.tiles.Provider.getInstance();
  var descriptor = new plugin.cesium.tiles.Descriptor();
  descriptor.setId(provider.getUniqueId());
  descriptor.setProvider(provider.getLabel());
  descriptor.setUrl(file.getUrl());

  plugin.cesium.tiles.Descriptor.updateFromConfig(descriptor, config);

  return descriptor;
};


/**
 * Updates an existing descriptor from a parser configuration.
 * @param {!plugin.cesium.tiles.Descriptor} descriptor
 * @param {!Object} config
 */
plugin.cesium.tiles.Descriptor.updateFromConfig = function(descriptor, config) {
  descriptor.setDescription(config['description']);
  descriptor.setTitle(config['title']);
  descriptor.setTags(config['tags'] ? config['tags'].split(/\s*,\s*/) : null);
};
