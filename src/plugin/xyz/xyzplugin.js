goog.provide('plugin.xyz.XYZPlugin');

goog.require('os.plugin.AbstractPlugin');
goog.require('plugin.xyz.XYZLayerConfig');



/**
 * Provides map layer support
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.xyz.XYZPlugin = function() {
  plugin.xyz.XYZPlugin.base(this, 'constructor');
  this.id = 'xyz';
};
goog.inherits(plugin.xyz.XYZPlugin, os.plugin.AbstractPlugin);


/**
 * @inheritDoc
 */
plugin.xyz.XYZPlugin.prototype.init = function() {
  var lcm = os.layer.config.LayerConfigManager.getInstance();
  lcm.registerLayerConfig('XYZ', plugin.xyz.XYZLayerConfig);
};
