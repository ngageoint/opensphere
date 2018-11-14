goog.provide('plugin.cesium.PrimitiveLayer');

goog.require('os.MapEvent');
goog.require('plugin.cesium.Layer');


/**
 * @extends {plugin.cesium.Layer}
 * @constructor
 */
plugin.cesium.PrimitiveLayer = function() {
  plugin.cesium.PrimitiveLayer.base(this, 'constructor');

  /**
   * @type {?Cesium.PrimitiveLike}
   * @protected
   */
  this.primitive = null;
};
goog.inherits(plugin.cesium.PrimitiveLayer, plugin.cesium.Layer);


/**
 * @inheritDoc
 */
plugin.cesium.PrimitiveLayer.prototype.disposeInternal = function() {
  plugin.cesium.PrimitiveLayer.base(this, 'disposeInternal');
  this.removePrimitive();
};


/**
 * @return {?Cesium.PrimitiveLike}
 */
plugin.cesium.PrimitiveLayer.prototype.getPrimitive = function() {
  return this.primitive;
};


/**
 * @param {?Cesium.PrimitiveLike} value
 */
plugin.cesium.PrimitiveLayer.prototype.setPrimitive = function(value) {
  this.removePrimitive();
  this.primitive = value;
  this.addPrimitive();
  this.updatePrimitive();
};


/**
 * @inheritDoc
 */
plugin.cesium.PrimitiveLayer.prototype.setLayerVisible = function(value) {
  plugin.cesium.PrimitiveLayer.base(this, 'setLayerVisible', value);
  this.updatePrimitive();
};


/**
 * @protected
 */
plugin.cesium.PrimitiveLayer.prototype.addPrimitive = function() {
  var primitive = this.getPrimitive();
  var scene = this.getScene();
  if (primitive && scene) {
    scene.primitives.add(primitive);
  }

  os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
};


/**
 * @protected
 */
plugin.cesium.PrimitiveLayer.prototype.updatePrimitive = function() {
  var primitive = this.getPrimitive();

  if (primitive) {
    primitive.show = this.getVisible();
  }

  os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
};


/**
 * @protected
 */
plugin.cesium.PrimitiveLayer.prototype.removePrimitive = function() {
  var primitive = this.getPrimitive();
  var scene = this.getScene();
  if (primitive && scene) {
    scene.primitives.remove(primitive);
  }

  os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
};
