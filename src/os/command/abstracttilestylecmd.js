goog.provide('os.command.AbstractTileStyle');

goog.require('os.command.AbstractStyle');



/**
 * Commands for tile style changes should extend this class
 *
 * @param {string} layerId
 * @param {T} value
 * @param {T=} opt_oldValue
 *
 * @extends {os.command.AbstractStyle}
 * @constructor
 * @template T
 */
os.command.AbstractTileStyle = function(layerId, value, opt_oldValue) {
  os.command.AbstractTileStyle.base(this, 'constructor', layerId, value, opt_oldValue);
};
goog.inherits(os.command.AbstractTileStyle, os.command.AbstractStyle);


/**
 * @inheritDoc
 */
os.command.AbstractTileStyle.prototype.getLayerConfig = function(layer) {
  return layer instanceof os.layer.Tile ? layer.getLayerOptions() : null;
};


/**
 * @inheritDoc
 */
os.command.AbstractTileStyle.prototype.applyValue = function(config, value) {
  // nothing to do right now
};
