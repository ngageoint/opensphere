goog.provide('os.command.LayerStyle');
goog.require('os.command.AbstractStyle');
goog.require('os.style');
goog.require('os.style.StyleManager');



/**
 * Changes the style of either a vector or tile layer. Requires a setter callback as well as the new value.
 * @param {string} layerId
 * @param {function(os.layer.ILayer, ?)} callback Callback to actually do the set on the layer.
 * @param {number} value The new value to set.
 * @param {number=} opt_oldValue Optional old value. If not provided, the command pulls the old value off the layer.
 * @extends {os.command.AbstractStyle}
 * @constructor
 * @template T
 */
os.command.LayerStyle = function(layerId, callback, value, opt_oldValue) {
  os.command.LayerStyle.base(this, 'constructor', layerId, value, opt_oldValue);

  /**
   * The setter callback to set the value on the layer.
   * @type {function(os.layer.ILayer, ?)}
   * @protected
   */
  this.callback = callback;
};
goog.inherits(os.command.LayerStyle, os.command.AbstractStyle);


/**
 * @inheritDoc
 */
os.command.LayerStyle.prototype.getOldValue = function() {
  var layer = os.MapContainer.getInstance().getLayer(this.layerId);
  if (os.implements(layer, os.layer.ILayer.ID)) {
    return /** @type {os.layer.ILayer} */ (layer).getOpacity();
  }

  return null;
};


/**
 * @inheritDoc
 */
os.command.LayerStyle.prototype.applyValue = function(config, value) {
  var layer = os.MapContainer.getInstance().getLayer(this.layerId);
  if (os.implements(layer, os.layer.ILayer.ID)) {
    this.callback(/** @type {os.layer.ILayer} */ (layer), value);
  }
};


/**
 * @inheritDoc
 */
os.command.LayerStyle.prototype.finish = function(config) {
  var layer = os.MapContainer.getInstance().getLayer(this.layerId);
  if (layer instanceof os.layer.Vector) {
    // only notify style changes on vector layers as it causes a flicker on tile layers
    os.style.notifyStyleChange(layer);
  }
};


/**
 * This method is similar to the one on the parent class, but since opacity changes apply to the drawing layer,
 * it doesn't bother to check whether the layer config is defined. The layer config isn't needed at all and the
 * drawing layer doesn't have one.
 * @override
 */
os.command.LayerStyle.prototype.setValue = function(value) {
  goog.asserts.assert(value != null, 'style value must be defined');

  var layer = /** @type {os.layer.Vector} */ (os.MapContainer.getInstance().getLayer(this.layerId));
  goog.asserts.assert(layer, 'layer must be defined');

  var config = this.getLayerConfig(layer) || {};

  this.applyValue(config, value);
  this.finish(config);
};
