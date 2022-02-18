goog.declareModuleId('plugin.cesium.sync.CesiumSynchronizer');

import AbstractWebGLSynchronizer from '../../../os/webgl/abstractsynchronizer.js';


/**
 * Abstract class to synchronize an OpenLayers layer to Cesium.
 *
 * @abstract
 * @extends {AbstractWebGLSynchronizer<T>}
 * @template T
 */
export default class CesiumSynchronizer extends AbstractWebGLSynchronizer {
  /**
   * Constructor.
   * @param {!T} layer The OpenLayers layer.
   * @param {!PluggableMap} map The OpenLayers map.
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
