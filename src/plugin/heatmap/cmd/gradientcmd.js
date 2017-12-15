goog.provide('plugin.heatmap.cmd.Gradient');
goog.require('os.command.AbstractStyle');



/**
 * Changes the gradient of a heatmap.
 * @extends {os.command.AbstractStyle}
 * @param {string} layerId
 * @param {number} value
 * @param {number=} opt_oldValue
 * @constructor
 */
plugin.heatmap.cmd.Gradient = function(layerId, value, opt_oldValue) {
  plugin.heatmap.cmd.Gradient.base(this, 'constructor', layerId, value, opt_oldValue);
  this.title = 'Change heatmap gradient';
};
goog.inherits(plugin.heatmap.cmd.Gradient, os.command.AbstractStyle);


/**
 * @inheritDoc
 */
plugin.heatmap.cmd.Gradient.prototype.getOldValue = function() {
  var layer = /** @type {plugin.heatmap.Heatmap} */ (this.getLayer());

  if (layer) {
    return layer.getGradient();
  }

  return null;
};


/**
 * @inheritDoc
 */
plugin.heatmap.cmd.Gradient.prototype.applyValue = function(config, value) {
  var layer = /** @type {plugin.heatmap.Heatmap} */ (this.getLayer());
  if (layer) {
    layer.setGradient(value);
  }
};


/**
 * I'm just here so I don't throw an error.
 * @inheritDoc
 */
plugin.heatmap.cmd.Gradient.prototype.getLayerConfig = function() {
  return {};
};
