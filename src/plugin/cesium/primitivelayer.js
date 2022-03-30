goog.declareModuleId('plugin.cesium.PrimitiveLayer');

import {transformExtent} from 'ol/src/proj.js';
import * as dispatcher from '../../os/dispatcher.js';
import * as geo from '../../os/geo/geo.js';
import {PROJECTION} from '../../os/map/map.js';
import MapEvent from '../../os/map/mapevent.js';
import * as osProj from '../../os/proj/proj.js';
import Layer from './layer.js';


/**
 */
export default class PrimitiveLayer extends Layer {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {?Cesium.PrimitiveLike}
     * @protected
     */
    this.primitive = null;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    this.removePrimitive();
  }

  /**
   * @return {?Cesium.PrimitiveLike}
   */
  getPrimitive() {
    return this.primitive;
  }

  /**
   * @param {?Cesium.PrimitiveLike} value
   */
  setPrimitive(value) {
    this.removePrimitive();
    this.primitive = value;
    this.addPrimitive();
    this.updatePrimitive();
  }

  /**
   * @inheritDoc
   */
  setLayerVisible(value) {
    super.setLayerVisible(value);
    this.updatePrimitive();
  }

  /**
   * @protected
   */
  addPrimitive() {
    var primitive = this.getPrimitive();
    var scene = this.getScene();
    if (primitive && scene) {
      scene.primitives.add(primitive);
    }

    dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
  }

  /**
   * @protected
   */
  updatePrimitive() {
    var primitive = this.getPrimitive();

    if (primitive) {
      primitive.show = this.getVisible();
    }

    dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
  }

  /**
   * @protected
   */
  removePrimitive() {
    var primitive = this.getPrimitive();
    var scene = this.getScene();
    if (primitive && scene) {
      scene.primitives.remove(primitive);
    }

    dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
  }

  /**
   * @inheritDoc
   */
  getExtent() {
    var primitive = this.getPrimitive();

    if (primitive && primitive.ready && primitive.boundingSphere) {
      var sphere = primitive.boundingSphere;
      var angle = Math.atan2(sphere.radius, Cesium.Cartesian3.magnitude(sphere.center));
      var cartographicCenter = Cesium.Cartographic.fromCartesian(sphere.center);
      var extent = [
        geo.R2D * (cartographicCenter.longitude - angle),
        geo.R2D * (cartographicCenter.latitude - angle),
        geo.R2D * (cartographicCenter.longitude + angle),
        geo.R2D * (cartographicCenter.latitude + angle)];

      return transformExtent(extent, osProj.EPSG4326, PROJECTION);
    }

    return undefined;
  }
}
