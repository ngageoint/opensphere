goog.provide('os.command.VectorLayerLOBMultiplier');

goog.require('os.command.AbstractVectorLayerLOB');
goog.require('os.metrics');



/**
 * Changes the lob length multiplier column
 * @param {string} layerId
 * @param {string} value
 * @param {string=} opt_oldValue
 * @extends {os.command.AbstractVectorLayerLOB<string>}
 * @constructor
 */
os.command.VectorLayerLOBMultiplier = function(layerId, value, opt_oldValue) {
  os.command.VectorLayerLOBMultiplier.base(this, 'constructor', layerId, value, opt_oldValue);
  this.title = 'Change Line of Bearing length column';
  this.value = value || '';
  this.metricKey = os.metrics.Layer.VECTOR_LOB_LENGTH_COLUMN;
};
goog.inherits(os.command.VectorLayerLOBMultiplier, os.command.AbstractVectorLayerLOB);


/**
 * @inheritDoc
 */
os.command.VectorLayerLOBMultiplier.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return config && config[os.style.StyleField.LOB_LENGTH_COLUMN] || '';
};


/**
 * @inheritDoc
 */
os.command.VectorLayerLOBMultiplier.prototype.applyValue = function(config, value) {
  config[os.style.StyleField.LOB_LENGTH_COLUMN] = value;
  os.command.VectorLayerLOBMultiplier.base(this, 'applyValue', config, value);
};
