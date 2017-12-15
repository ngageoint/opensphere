goog.provide('plugin.heatmap.cmd.Size');
goog.require('os.command.AbstractStyle');



/**
 * Changes the size of a heatmap.
 * @extends {os.command.AbstractStyle}
 * @param {string} layerId
 * @param {number} value
 * @param {number=} opt_oldValue
 * @constructor
 */
plugin.heatmap.cmd.Size = function(layerId, value, opt_oldValue) {
  plugin.heatmap.cmd.Size.base(this, 'constructor', layerId, value, opt_oldValue);
  this.title = 'Change heatmap intensity';
};
goog.inherits(plugin.heatmap.cmd.Size, os.command.AbstractStyle);


/**
 * @inheritDoc
 */
plugin.heatmap.cmd.Size.prototype.getOldValue = function() {
  var layer = /** @type {plugin.heatmap.Heatmap} */ (this.getLayer());

  if (layer) {
    return layer.getSize();
  }

  return null;
};


/**
 * @inheritDoc
 */
plugin.heatmap.cmd.Size.prototype.applyValue = function(config, value) {
  var layer = /** @type {plugin.heatmap.Heatmap} */ (this.getLayer());
  if (layer) {
    layer.setSize(value);
  }
};


/**
 * I'm just here so I don't throw an error.
 * @inheritDoc
 */
plugin.heatmap.cmd.Size.prototype.getLayerConfig = function() {
  return {};
};
