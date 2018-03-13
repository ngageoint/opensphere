goog.provide('plugin.cesium.Plugin');

goog.require('os.plugin.AbstractPlugin');
goog.require('plugin.cesium.CesiumRenderer');
goog.require('plugin.cesium.mixin.olcs');
goog.require('plugin.cesium.mixin.renderloop');


/**
 * Provides a WebGL renderer for the map, powered by Cesium.
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.cesium.Plugin = function() {
  plugin.cesium.Plugin.base(this, 'constructor');
  this.id = plugin.cesium.Plugin.ID;
};
goog.inherits(plugin.cesium.Plugin, os.plugin.AbstractPlugin);


/**
 * The plugin identifier.
 * @type {string}
 * @const
 */
plugin.cesium.Plugin.ID = 'cesium';


/**
 * @inheritDoc
 */
plugin.cesium.Plugin.prototype.init = function() {
  os.MapContainer.getInstance().setWebGLRenderer(new plugin.cesium.CesiumRenderer());
};
