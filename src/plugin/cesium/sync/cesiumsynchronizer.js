goog.module('plugin.cesium.sync.CesiumSynchronizer');
goog.module.declareLegacyNamespace();

const AbstractWebGLSynchronizer = goog.require('os.webgl.AbstractWebGLSynchronizer');


/**
 * Abstract class to synchronize an OpenLayers layer to Cesium.
 *
 * @abstract
 * @extends {AbstractWebGLSynchronizer<T>}
 * @template T
 */
class CesiumSynchronizer extends AbstractWebGLSynchronizer {
  /**
   * Constructor.
   * @param {!T} layer The OpenLayers layer.
   * @param {!ol.PluggableMap} map The OpenLayers map.
   * @param {!Cesium.Scene} scene The Cesium scene.
   */
  constructor(layer, map, scene) {
    super(layer, map);

    /**
     * The Cesium scene.
     * @type {!Cesium.Scene}
     * @protected
     */
    this.scene = scene;
  }
}

exports = CesiumSynchronizer;
