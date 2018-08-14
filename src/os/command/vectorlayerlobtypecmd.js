goog.provide('os.command.VectorLayerLOBType');

goog.require('os.command.AbstractVectorLayerLOB');
goog.require('os.metrics');



/**
 * Changes the lob length type
 * @param {string} layerId
 * @param {string} value
 * @param {string=} opt_oldValue
 * @extends {os.command.AbstractVectorLayerLOB<string>}
 * @constructor
 */
os.command.VectorLayerLOBType = function(layerId, value, opt_oldValue) {
  os.command.VectorLayerLOBType.base(this, 'constructor', layerId, value, opt_oldValue);
  this.title = 'Change Line of Bearing length type (manual or column)';
  this.value = value || os.style.DEFAULT_LOB_LENGTH_TYPE;
  this.metricKey = os.metrics.Layer.VECTOR_LOB_LENGTH_TYPE;
};
goog.inherits(os.command.VectorLayerLOBType, os.command.AbstractVectorLayerLOB);


/**
 * @inheritDoc
 */
os.command.VectorLayerLOBType.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return config && config[os.style.StyleField.LOB_LENGTH_TYPE] || os.style.DEFAULT_LOB_LENGTH_TYPE;
};


/**
 * @inheritDoc
 */
os.command.VectorLayerLOBType.prototype.applyValue = function(config, value) {
  config[os.style.StyleField.LOB_LENGTH_TYPE] = value;
  os.command.VectorLayerLOBType.base(this, 'applyValue', config, value);
};
