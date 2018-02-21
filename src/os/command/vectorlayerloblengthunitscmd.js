goog.provide('os.command.VectorLayerLOBLengthUnits');

goog.require('os.command.AbstractVectorLayerLOB');
goog.require('os.metrics');



/**
 * Changes the lob length units
 * @param {string} layerId
 * @param {string} value
 * @param {string=} opt_oldValue
 * @extends {os.command.AbstractVectorLayerLOB<string>}
 * @constructor
 */
os.command.VectorLayerLOBLengthUnits = function(layerId, value, opt_oldValue) {
  os.command.VectorLayerLOBLengthUnits.base(this, 'constructor', layerId, value, opt_oldValue);
  this.title = 'Change length units';
  this.value = value || os.style.DEFAULT_UNITS;
  this.metricKey = os.metrics.Layer.VECTOR_LOB_LENGTH_UNITS;
};
goog.inherits(os.command.VectorLayerLOBLengthUnits, os.command.AbstractVectorLayerLOB);


/**
 * @inheritDoc
 */
os.command.VectorLayerLOBLengthUnits.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return config && config[os.style.StyleField.LOB_LENGTH_UNITS] || os.style.DEFAULT_UNITS;
};


/**
 * @inheritDoc
 */
os.command.VectorLayerLOBLengthUnits.prototype.applyValue = function(config, value) {
  config[os.style.StyleField.LOB_LENGTH_UNITS] = value;

  os.command.VectorLayerLOBLengthUnits.base(this, 'applyValue', config, value);
};
