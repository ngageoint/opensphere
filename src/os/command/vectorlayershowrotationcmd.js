goog.provide('os.command.VectorLayerShowRotation');

goog.require('os.command.AbstractVectorLayerLOB');
goog.require('os.metrics');



/**
 * Changes if icon rotation is shown.
 * @param {string} layerId
 * @param {boolean} value
 * @param {boolean=} opt_oldValue
 * @extends {os.command.AbstractVectorLayerLOB<boolean>}
 * @constructor
 */
os.command.VectorLayerShowRotation = function(layerId, value, opt_oldValue) {
  os.command.VectorLayerShowRotation.base(this, 'constructor', layerId, value, opt_oldValue);
  this.metricKey = os.metrics.Layer.VECTOR_SHOW_ROTATION;

  // make sure the value is a boolean
  this.value = !!value;
  this.title = value ? 'Enable Icon Rotation' : 'Disable Icon Rotation';
};
goog.inherits(os.command.VectorLayerShowRotation, os.command.AbstractVectorLayerLOB);


/**
 * @inheritDoc
 */
os.command.VectorLayerShowRotation.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return config != null && config[os.style.StyleField.SHOW_ROTATION] || false;
};


/**
 * @inheritDoc
 */
os.command.VectorLayerShowRotation.prototype.applyValue = function(config, value) {
  config[os.style.StyleField.SHOW_ROTATION] = value;
  os.command.VectorLayerShowRotation.base(this, 'applyValue', config, value);
};
