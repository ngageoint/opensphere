goog.provide('os.command.VectorLayerLOBLengthError');

goog.require('os.command.AbstractVectorLayerLOB');
goog.require('os.metrics');



/**
 * Changes the lob length
 * @param {string} layerId
 * @param {number} value
 * @param {number=} opt_oldValue
 * @extends {os.command.AbstractVectorLayerLOB<number>}
 * @constructor
 */
os.command.VectorLayerLOBLengthError = function(layerId, value, opt_oldValue) {
  os.command.VectorLayerLOBLengthError.base(this, 'constructor', layerId, value, opt_oldValue);
  this.title = 'Change Line of Bearing length error column multiplier';
  this.value = value;
  this.metricKey = os.metrics.Layer.VECTOR_LOB_LENGTH_ERROR;
};
goog.inherits(os.command.VectorLayerLOBLengthError, os.command.AbstractVectorLayerLOB);


/**
 * @inheritDoc
 */
os.command.VectorLayerLOBLengthError.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return config ? config[os.style.StyleField.LOB_LENGTH_ERROR] : os.style.DEFAULT_LOB_LENGTH_ERROR;
};


/**
 * @inheritDoc
 */
os.command.VectorLayerLOBLengthError.prototype.applyValue = function(config, value) {
  config[os.style.StyleField.LOB_LENGTH_ERROR] = value;
  os.command.VectorLayerLOBLengthError.base(this, 'applyValue', config, value);
};
