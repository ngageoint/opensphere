goog.provide('os.command.VectorLayerSize');

goog.require('os.command.AbstractVectorStyle');
goog.require('os.command.ICommand');
goog.require('os.metrics');


/**
 * Changes the size of a layer
 * @implements {os.command.ICommand}
 * @extends {os.command.AbstractVectorStyle}
 * @param {string} layerId
 * @param {number} size
 * @param {number=} opt_oldSize
 * @constructor
 */
os.command.VectorLayerSize = function(layerId, size, opt_oldSize) {
  os.command.VectorLayerSize.base(this, 'constructor', layerId, size, opt_oldSize);
  this.title = 'Change Size';
  this.metricKey = os.metrics.Layer.VECTOR_SIZE;
};
goog.inherits(os.command.VectorLayerSize, os.command.AbstractVectorStyle);


/**
 * @inheritDoc
 */
os.command.VectorLayerSize.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return os.style.getConfigSize(config);
};


/**
 * @inheritDoc
 */
os.command.VectorLayerSize.prototype.applyValue = function(config, value) {
  var size = /** @type {number} */ (value);
  os.style.setConfigSize(config, size);

  os.command.VectorLayerSize.base(this, 'applyValue', config, value);
};
