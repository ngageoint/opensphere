goog.provide('os.command.AbstractLayerStyle');

goog.require('os.command.AbstractStyle');



/**
 * Commands for `os.layer.ILayer` style changes should extend this class.
 *
 * @param {string} layerId The layer id.
 * @param {T} value The new style value.
 * @param {T=} opt_oldValue The old style value.
 *
 * @extends {os.command.AbstractStyle}
 * @constructor
 * @template T
 */
os.command.AbstractLayerStyle = function(layerId, value, opt_oldValue) {
  os.command.AbstractLayerStyle.base(this, 'constructor', layerId, value, opt_oldValue);
};
goog.inherits(os.command.AbstractLayerStyle, os.command.AbstractStyle);


/**
 * @inheritDoc
 */
os.command.AbstractLayerStyle.prototype.getLayerConfig = function(layer) {
  if (os.implements(layer, os.layer.ILayer.ID)) {
    return /** @type {os.layer.ILayer} */ (layer).getLayerOptions();
  }
  return null;
};


/**
 * @inheritDoc
 */
os.command.AbstractLayerStyle.prototype.applyValue = function(config, value) {
  // nothing to do right now
};
