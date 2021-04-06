goog.module('plugin.cesium.PrimitiveLayer');

const geo = goog.require('os.geo');
const dispatcher = goog.require('os.Dispatcher');
const MapEvent = goog.require('os.MapEvent');
const Layer = goog.require('plugin.cesium.Layer');


/**
 */
class PrimitiveLayer extends Layer {
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

      return ol.proj.transformExtent(extent, os.proj.EPSG4326, os.map.PROJECTION);
    }

    return undefined;
  }
}

exports = PrimitiveLayer;
