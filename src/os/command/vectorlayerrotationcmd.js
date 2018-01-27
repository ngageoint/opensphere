goog.provide('os.command.VectorLayerRotation');

goog.require('os.command.AbstractVectorLayerLOB');
goog.require('os.metrics');



/**
 * Changes the icon rotation column
 * @param {string} layerId
 * @param {string} value
 * @param {string=} opt_oldValue
 * @extends {os.command.AbstractVectorLayerLOB<string>}
 * @constructor
 */
os.command.VectorLayerRotation = function(layerId, value, opt_oldValue) {
  os.command.VectorLayerRotation.base(this, 'constructor', layerId, value, opt_oldValue);
  this.title = 'Change icon rotation column';
  this.value = value || '';
  this.metricKey = os.metrics.Layer.VECTOR_ROTATION_COLUMN;
};
goog.inherits(os.command.VectorLayerRotation, os.command.AbstractVectorLayerLOB);


/**
 * @inheritDoc
 */
os.command.VectorLayerRotation.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return config && config[os.style.StyleField.ROTATION_COLUMN] || '';
};


/**
 * @inheritDoc
 */
os.command.VectorLayerRotation.prototype.applyValue = function(config, value) {
  config[os.style.StyleField.ROTATION_COLUMN] = value;

  os.command.VectorLayerRotation.base(this, 'applyValue', config, value);
};
