goog.provide('os.command.LayerColor');

goog.require('os.command.AbstractLayerStyle');
goog.require('os.implements');
goog.require('os.layer.IColorableLayer');
goog.require('os.style');



/**
 * Changes the color of a layer.
 *
 * @param {string} layerId The layer id.
 * @param {Array<number>|string} color The new layer color.
 * @param {(Array<number>|string)=} opt_oldColor The old layer color.
 *
 * @extends {os.command.AbstractLayerStyle<Array<number>|string>}
 * @constructor
 */
os.command.LayerColor = function(layerId, color, opt_oldColor) {
  os.command.LayerColor.base(this, 'constructor', layerId, color, opt_oldColor);
  this.title = 'Change Layer Color';

  // make sure the value is a string
  if (color) {
    this.value = os.style.toRgbaString(color);
  } else {
    var layer = os.MapContainer.getInstance().getLayer(layerId);
    if (os.implements(layer, os.layer.ILayer.ID)) {
      var options = /** @type {os.layer.ILayer} */ (layer).getLayerOptions();
      this.value = /** @type {string} */ (options && options['baseColor'] || os.style.DEFAULT_LAYER_COLOR);
    }
  }
};
goog.inherits(os.command.LayerColor, os.command.AbstractLayerStyle);


/**
 * @inheritDoc
 */
os.command.LayerColor.prototype.getOldValue = function() {
  var layer = os.MapContainer.getInstance().getLayer(this.layerId);
  if (os.implements(layer, os.layer.IColorableLayer.ID)) {
    return /** @type {os.layer.IColorableLayer} */ (layer).getColor();
  }
  return null;
};


/**
 * @inheritDoc
 */
os.command.LayerColor.prototype.applyValue = function(config, value) {
  var layer = os.MapContainer.getInstance().getLayer(this.layerId);
  if (os.implements(layer, os.layer.IColorableLayer.ID)) {
    /** @type {os.layer.IColorableLayer} */ (layer).setColor(value);
  }

  os.command.LayerColor.base(this, 'applyValue', config, value);
};
