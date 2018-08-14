goog.provide('plugin.track.TrackPlugin');

goog.require('os.layer.config.LayerConfigManager');
goog.require('os.plugin.AbstractPlugin');
goog.require('plugin.track');
goog.require('plugin.track.TrackLayerConfig');
goog.require('plugin.track.menu');



/**
 * Provides the ability to create tracks that can be animated over time.
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.track.TrackPlugin = function() {
  plugin.track.TrackPlugin.base(this, 'constructor');
  this.id = plugin.track.ID;
};
goog.inherits(plugin.track.TrackPlugin, os.plugin.AbstractPlugin);
goog.addSingletonGetter(plugin.track.TrackPlugin);


/**
 * @inheritDoc
 */
plugin.track.TrackPlugin.prototype.init = function() {
  plugin.track.menu.layerSetup();
  plugin.track.menu.spatialSetup();

  os.layer.config.LayerConfigManager.getInstance().registerLayerConfig(
      plugin.track.ID, plugin.track.TrackLayerConfig);
};
