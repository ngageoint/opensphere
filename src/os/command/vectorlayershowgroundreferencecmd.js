goog.provide('os.command.VectorLayerShowGroundReference');

goog.require('os.command.AbstractVectorLayerLOB');
goog.require('os.metrics');



/**
 * Changes if ellipse ground reference is shown in 3D mode.
 * @param {string} layerId
 * @param {boolean} value
 * @param {boolean=} opt_oldValue
 * @extends {os.command.AbstractVectorLayerLOB}
 * @constructor
 */
os.command.VectorLayerShowGroundReference = function(layerId, value, opt_oldValue) {
  os.command.VectorLayerShowGroundReference.base(this, 'constructor', layerId, value, opt_oldValue);
  this.metricKey = os.metrics.Layer.VECTOR_GROUND_REF;

  // make sure the value is a boolean
  this.value = !!value;
  this.title = value ? 'Enable Ground Reference' : 'Disable Ground Reference';
};
goog.inherits(os.command.VectorLayerShowGroundReference, os.command.AbstractVectorLayerLOB);


/**
 * @inheritDoc
 */
os.command.VectorLayerShowGroundReference.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return config != null && config[os.style.StyleField.SHOW_GROUND_REF] || false;
};


/**
 * @inheritDoc
 */
os.command.VectorLayerShowGroundReference.prototype.applyValue = function(config, value) {
  config[os.style.StyleField.SHOW_GROUND_REF] = value;
  os.command.VectorLayerShowGroundReference.base(this, 'applyValue', config, value);
};
