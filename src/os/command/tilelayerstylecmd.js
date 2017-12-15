goog.provide('os.command.TileLayerStyle');

goog.require('os.command.AbstractTileStyle');
goog.require('os.command.ICommand');
goog.require('os.command.State');
goog.require('os.ui');



/**
 * Changes the style of a tile layer
 *
 * @param {string} layerId
 * @param {?(string|osx.ogc.TileStyle)} style
 * @param {(?(string|osx.ogc.TileStyle))=} opt_oldStyle
 *
 * @extends {os.command.AbstractTileStyle}
 * @constructor
 */
os.command.TileLayerStyle = function(layerId, style, opt_oldStyle) {
  os.command.TileLayerStyle.base(this, 'constructor', layerId, style, opt_oldStyle);
  this.title = 'Change Layer Style';
};
goog.inherits(os.command.TileLayerStyle, os.command.AbstractTileStyle);


/**
 * @inheritDoc
 */
os.command.TileLayerStyle.prototype.getOldValue = function() {
  var layer = os.MapContainer.getInstance().getLayer(this.layerId);
  return layer instanceof os.layer.Tile ? layer.getStyle() : null;
};


/**
 * @inheritDoc
 */
os.command.TileLayerStyle.prototype.applyValue = function(config, value) {
  var layer = os.MapContainer.getInstance().getLayer(this.layerId);
  if (layer instanceof os.layer.Tile) {
    layer.setStyle(value);
  }

  os.command.TileLayerStyle.base(this, 'applyValue', config, value);
};
