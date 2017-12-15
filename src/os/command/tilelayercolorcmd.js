goog.provide('os.command.TileLayerColor');

goog.require('ol.color');
goog.require('os.command.AbstractTileStyle');
goog.require('os.command.ICommand');
goog.require('os.command.State');
goog.require('os.ui');



/**
 * Changes the color of a tile layer
 *
 * @param {string} layerId
 * @param {Array<number>|string} color
 * @param {(Array<number>|string)=} opt_oldColor
 *
 * @extends {os.command.AbstractTileStyle}
 * @constructor
 */
os.command.TileLayerColor = function(layerId, color, opt_oldColor) {
  os.command.TileLayerColor.base(this, 'constructor', layerId, color, opt_oldColor);
  this.title = 'Change Layer Color';

  // make sure the value is a string
  if (color) {
    this.value = os.style.toRgbaString(color);
  }
};
goog.inherits(os.command.TileLayerColor, os.command.AbstractTileStyle);


/**
 * @inheritDoc
 */
os.command.TileLayerColor.prototype.getOldValue = function() {
  var layer = os.MapContainer.getInstance().getLayer(this.layerId);
  return layer instanceof os.layer.Tile ? layer.getColor() : null;
};


/**
 * @inheritDoc
 */
os.command.TileLayerColor.prototype.applyValue = function(config, value) {
  var layer = os.MapContainer.getInstance().getLayer(this.layerId);
  if (layer instanceof os.layer.Tile) {
    layer.setColor(value);
  }

  os.command.TileLayerColor.base(this, 'applyValue', config, value);
};
