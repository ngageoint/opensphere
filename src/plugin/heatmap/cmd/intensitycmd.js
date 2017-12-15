goog.provide('plugin.heatmap.cmd.Intensity');
goog.require('os.command.AbstractStyle');



/**
 * Changes the intensity of a heatmap.
 * @extends {os.command.AbstractStyle}
 * @param {string} layerId
 * @param {number} value
 * @param {number=} opt_oldValue
 * @constructor
 */
plugin.heatmap.cmd.Intensity = function(layerId, value, opt_oldValue) {
  plugin.heatmap.cmd.Intensity.base(this, 'constructor', layerId, value, opt_oldValue);
  this.title = 'Change heatmap intensity';
};
goog.inherits(plugin.heatmap.cmd.Intensity, os.command.AbstractStyle);


/**
 * @inheritDoc
 */
plugin.heatmap.cmd.Intensity.prototype.getOldValue = function() {
  var layer = /** @type {plugin.heatmap.Heatmap} */ (this.getLayer());

  if (layer) {
    return layer.getIntensity();
  }

  return null;
};


/**
 * @inheritDoc
 */
plugin.heatmap.cmd.Intensity.prototype.applyValue = function(config, value) {
  var layer = /** @type {plugin.heatmap.Heatmap} */ (this.getLayer());
  if (layer) {
    layer.setIntensity(value);
  }
};


/**
 * I'm just here so I don't throw an error.
 * @inheritDoc
 */
plugin.heatmap.cmd.Intensity.prototype.getLayerConfig = function() {
  return {};
};
