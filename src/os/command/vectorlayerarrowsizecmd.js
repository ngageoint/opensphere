goog.provide('os.command.VectorLayerArrowSize');

goog.require('os.command.AbstractVectorLayerLOB');
goog.require('os.metrics');



/**
 * Changes the arrow size for a lob
 * @param {string} layerId
 * @param {number} value
 * @param {number=} opt_oldValue
 * @extends {os.command.AbstractVectorLayerLOB<number>}
 * @constructor
 */
os.command.VectorLayerArrowSize = function(layerId, value, opt_oldValue) {
  os.command.VectorLayerArrowSize.base(this, 'constructor', layerId, value, opt_oldValue);
  this.title = 'Change Line of Bearing arrow size';
  this.value = value;
  this.metricKey = os.metrics.Layer.VECTOR_ARROW_SIZE;
};
goog.inherits(os.command.VectorLayerArrowSize, os.command.AbstractVectorLayerLOB);


/**
 * @inheritDoc
 */
os.command.VectorLayerArrowSize.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return config ? config[os.style.StyleField.ARROW_SIZE] : os.style.DEFAULT_ARROW_SIZE;
};


/**
 * @inheritDoc
 */
os.command.VectorLayerArrowSize.prototype.applyValue = function(config, value) {
  config[os.style.StyleField.ARROW_SIZE] = value;
  os.command.VectorLayerArrowSize.base(this, 'applyValue', config, value);
};
