goog.provide('os.command.TileLayerColorize');

goog.require('os.command.AbstractLayerStyle');
goog.require('os.command.ICommand');
goog.require('os.command.State');



/**
 * Changes whether a layer is colorized.
 * @param {string} layerId
 * @param {boolean} value
 * @param {boolean=} opt_oldValue
 * @extends {os.command.AbstractLayerStyle}
 * @constructor
 */
os.command.TileLayerColorize = function(layerId, value, opt_oldValue) {
  os.command.TileLayerColorize.base(this, 'constructor', layerId, value, opt_oldValue);
  this.title = 'Colorize Layer';
  this.value = value;
};
goog.inherits(os.command.TileLayerColorize, os.command.AbstractLayerStyle);


/**
 * @inheritDoc
 */
os.command.TileLayerColorize.prototype.getOldValue = function() {
  var layer = os.MapContainer.getInstance().getLayer(this.layerId);
  return layer instanceof os.layer.Tile ? layer.getColorize() : null;
};


/**
 * @inheritDoc
 */
os.command.TileLayerColorize.prototype.applyValue = function(config, value) {
  var layer = os.MapContainer.getInstance().getLayer(this.layerId);
  if (layer instanceof os.layer.Tile) {
    layer.setColorize(value);
  }

  os.command.TileLayerColorize.base(this, 'applyValue', config, value);
};
