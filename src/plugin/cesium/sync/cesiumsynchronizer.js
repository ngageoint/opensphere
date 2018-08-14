goog.provide('plugin.cesium.sync.CesiumSynchronizer');

goog.require('os.webgl.AbstractWebGLSynchronizer');



/**
 * Abstract class to synchronize an OpenLayers layer to Cesium.
 * @param {!T} layer The OpenLayers layer.
 * @param {!ol.PluggableMap} map The OpenLayers map.
 * @param {!Cesium.Scene} scene The Cesium scene.
 * @extends {os.webgl.AbstractWebGLSynchronizer<T>}
 * @constructor
 * @template T
 */
plugin.cesium.sync.CesiumSynchronizer = function(layer, map, scene) {
  plugin.cesium.sync.CesiumSynchronizer.base(this, 'constructor', layer, map);

  /**
   * The Cesium scene.
   * @type {!Cesium.Scene}
   * @protected
   */
  this.scene = scene;
};
goog.inherits(plugin.cesium.sync.CesiumSynchronizer, os.webgl.AbstractWebGLSynchronizer);
