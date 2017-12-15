goog.provide('os.command.VectorLayerLOBLength');

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
os.command.VectorLayerLOBLength = function(layerId, value, opt_oldValue) {
  os.command.VectorLayerLOBLength.base(this, 'constructor', layerId, value, opt_oldValue);
  this.title = 'Change Line of Bearing length';
  this.value = value;
  this.metricKey = os.metrics.Layer.VECTOR_LOB_LENGTH;
};
goog.inherits(os.command.VectorLayerLOBLength, os.command.AbstractVectorLayerLOB);


/**
 * @inheritDoc
 */
os.command.VectorLayerLOBLength.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return config ? config[os.style.StyleField.LOB_LENGTH] : os.style.DEFAULT_LOB_LENGTH;
};


/**
 * @inheritDoc
 */
os.command.VectorLayerLOBLength.prototype.applyValue = function(config, value) {
  config[os.style.StyleField.LOB_LENGTH] = value;
  os.command.VectorLayerLOBLength.base(this, 'applyValue', config, value);
};
