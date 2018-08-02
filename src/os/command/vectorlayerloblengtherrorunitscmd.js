goog.provide('os.command.VectorLayerLOBLengthErrorUnits');

goog.require('os.command.AbstractVectorLayerLOB');
goog.require('os.metrics');



/**
 * Changes the lob length error units
 * @param {string} layerId
 * @param {string} value
 * @param {string=} opt_oldValue
 * @extends {os.command.AbstractVectorLayerLOB<string>}
 * @constructor
 */
os.command.VectorLayerLOBLengthErrorUnits = function(layerId, value, opt_oldValue) {
  os.command.VectorLayerLOBLengthErrorUnits.base(this, 'constructor', layerId, value, opt_oldValue);
  this.title = 'Change length error units';
  this.value = value || os.style.DEFAULT_UNITS;
  this.metricKey = os.metrics.Layer.VECTOR_LOB_LENGTH_ERROR_UNITS;
};
goog.inherits(os.command.VectorLayerLOBLengthErrorUnits, os.command.AbstractVectorLayerLOB);


/**
 * @inheritDoc
 */
os.command.VectorLayerLOBLengthErrorUnits.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return config && config[os.style.StyleField.LOB_LENGTH_ERROR_UNITS] || os.style.DEFAULT_UNITS;
};


/**
 * @inheritDoc
 */
os.command.VectorLayerLOBLengthErrorUnits.prototype.applyValue = function(config, value) {
  config[os.style.StyleField.LOB_LENGTH_ERROR_UNITS] = value;

  os.command.VectorLayerLOBLengthErrorUnits.base(this, 'applyValue', config, value);
};
