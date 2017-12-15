goog.provide('os.command.VectorLayerLOBError');

goog.require('os.command.AbstractVectorLayerLOB');
goog.require('os.metrics');



/**
 * Changes the lob bearing error column
 * @param {string} layerId
 * @param {string} value
 * @param {string=} opt_oldValue
 * @extends {os.command.AbstractVectorLayerLOB<string>}
 * @constructor
 */
os.command.VectorLayerLOBError = function(layerId, value, opt_oldValue) {
  os.command.VectorLayerLOBError.base(this, 'constructor', layerId, value, opt_oldValue);
  this.title = 'Change Line of Bearing bearing error column';
  this.value = value || '';
  this.metricKey = os.metrics.Layer.VECTOR_LOB_LENGTH_ERROR_COLUMN;
};
goog.inherits(os.command.VectorLayerLOBError, os.command.AbstractVectorLayerLOB);


/**
 * @inheritDoc
 */
os.command.VectorLayerLOBError.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return config && config[os.style.StyleField.LOB_LENGTH_ERROR_COLUMN] || '';
};


/**
 * @inheritDoc
 */
os.command.VectorLayerLOBError.prototype.applyValue = function(config, value) {
  config[os.style.StyleField.LOB_LENGTH_ERROR_COLUMN] = value;
  os.command.VectorLayerLOBError.base(this, 'applyValue', config, value);
};
