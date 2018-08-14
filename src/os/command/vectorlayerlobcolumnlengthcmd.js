goog.provide('os.command.VectorLayerLOBColumnLength');

goog.require('os.command.AbstractVectorLayerLOB');
goog.require('os.metrics');



/**
 * Changes the lob column length
 * @param {string} layerId
 * @param {number} value
 * @param {number=} opt_oldValue
 * @extends {os.command.AbstractVectorLayerLOB<number>}
 * @constructor
 */
os.command.VectorLayerLOBColumnLength = function(layerId, value, opt_oldValue) {
  os.command.VectorLayerLOBColumnLength.base(this, 'constructor', layerId, value, opt_oldValue);
  this.title = 'Change Line of Bearing column length';
  this.value = value;
  this.metricKey = os.metrics.Layer.VECTOR_LOB_COLUMN_LENGTH;
};
goog.inherits(os.command.VectorLayerLOBColumnLength, os.command.AbstractVectorLayerLOB);


/**
 * @inheritDoc
 */
os.command.VectorLayerLOBColumnLength.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return config ? config[os.style.StyleField.LOB_COLUMN_LENGTH] : os.style.DEFAULT_LOB_LENGTH;
};


/**
 * @inheritDoc
 */
os.command.VectorLayerLOBColumnLength.prototype.applyValue = function(config, value) {
  config[os.style.StyleField.LOB_COLUMN_LENGTH] = value;
  os.command.VectorLayerLOBColumnLength.base(this, 'applyValue', config, value);
};
