goog.provide('os.command.VectorLayerLineDash');

goog.require('os.command.AbstractVectorStyle');
goog.require('os.command.ICommand');
goog.require('os.metrics');


/**
 * Changes the line dash of a layer
 * @extends {os.command.AbstractVectorStyle}
 * @param {string} layerId
 * @param {Array<number>} lineDash
 * @param {Array<number>=} opt_oldLineDash
 * @constructor
 */
os.command.VectorLayerLineDash = function(layerId, lineDash, opt_oldLineDash) {
  os.command.VectorLayerLineDash.base(this, 'constructor', layerId, lineDash, opt_oldLineDash);
  this.title = 'Change LineDash';
  this.metricKey = os.metrics.Layer.VECTOR_LINE_DASH;
};
goog.inherits(os.command.VectorLayerLineDash, os.command.AbstractVectorStyle);


/**
 * @inheritDoc
 */
os.command.VectorLayerLineDash.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return os.style.getConfigLineDash(config);
};


/**
 * @inheritDoc
 */
os.command.VectorLayerLineDash.prototype.applyValue = function(config, value) {
  var lineDash = /** @type {Array<number>} */ (value);
  os.style.setConfigLineDash(config, lineDash);

  os.command.VectorLayerLineDash.base(this, 'applyValue', config, value);
};
