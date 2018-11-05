goog.provide('plugin.cesium.tiles.Descriptor');

goog.require('os.data.IUrlDescriptor');
goog.require('os.data.LayerSyncDescriptor');


/**
 * Cesium 3D tiles descriptor.
 * @implements {os.data.IUrlDescriptor}
 * @extends {os.data.LayerSyncDescriptor}
 * @constructor
 */
plugin.cesium.tiles.Descriptor = function() {
  plugin.cesium.tiles.Descriptor.base(this, 'constructor');
  this.descriptorType = plugin.cesium.tiles.TYPE;

  /**
   * @type {?string}
   * @private
   */
  this.url_ = null;
};
goog.inherits(plugin.cesium.tiles.Descriptor, os.data.LayerSyncDescriptor);
os.implements(plugin.cesium.tiles.Descriptor, os.data.IUrlDescriptor.ID);


/**
 * @inheritDoc
 */
plugin.cesium.tiles.Descriptor.prototype.getIcons = function() {
  return '<i class="fa fa-cube" title="Cesium 3D tile layer."></i>';
};


/**
 * @inheritDoc
 */
plugin.cesium.tiles.Descriptor.prototype.getLayerOptions = function() {
  var options = {};

  options['id'] = this.getId();
  options['type'] = plugin.cesium.tiles.TYPE;
  options['load'] = true;
  options['provider'] = this.getProvider();
  options['tags'] = this.getTags();
  options['title'] = this.getTitle();
  options['url'] = this.getUrl();

  return options;
};


/**
 * @inheritDoc
 */
plugin.cesium.tiles.Descriptor.prototype.getUrl = function() {
  return this.url_;
};


/**
 * @inheritDoc
 */
plugin.cesium.tiles.Descriptor.prototype.setUrl = function(value) {
  this.url_ = value;
};


/**
 * Creates a new descriptor from a parser configuration.
 * @param {!Object} config
 * @return {!plugin.cesium.tiles.Descriptor}
 */
plugin.cesium.tiles.Descriptor.createFromConfig = function(config) {
  var descriptor = new plugin.cesium.tiles.Descriptor();

  plugin.cesium.tiles.Descriptor.updateFromConfig(descriptor, config);

  return descriptor;
};


/**
 * Updates an existing descriptor from a parser configuration.
 * @param {!plugin.cesium.tiles.Descriptor} descriptor
 * @param {!Object} config
 */
plugin.cesium.tiles.Descriptor.updateFromConfig = function(descriptor, config) {
  descriptor.setId(config['id']);
  descriptor.setUrl(config['url']);
  descriptor.setDescription(config['description']);
  descriptor.setTitle(config['title']);
  descriptor.setTags(config['tags'] ? config['tags'].split(/\s*,\s*/) : null);
};
