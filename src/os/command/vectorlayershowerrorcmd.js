goog.provide('os.command.VectorLayerShowError');

goog.require('os.command.AbstractVectorLayerLOB');
goog.require('os.metrics');



/**
 * Changes if lob errors are shown.
 * @param {string} layerId
 * @param {boolean} value
 * @param {boolean=} opt_oldValue
 * @extends {os.command.AbstractVectorLayerLOB<boolean>}
 * @constructor
 */
os.command.VectorLayerShowError = function(layerId, value, opt_oldValue) {
  os.command.VectorLayerShowError.base(this, 'constructor', layerId, value, opt_oldValue);
  this.metricKey = os.metrics.Layer.VECTOR_SHOW_ERROR;

  // make sure the value is a boolean
  this.value = !!value;
  this.title = value ? 'Enable Show Error' : 'Disable Show Error';
};
goog.inherits(os.command.VectorLayerShowError, os.command.AbstractVectorLayerLOB);


/**
 * @inheritDoc
 */
os.command.VectorLayerShowError.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return config != null && config[os.style.StyleField.SHOW_ERROR] || false;
};


/**
 * @inheritDoc
 */
os.command.VectorLayerShowError.prototype.applyValue = function(config, value) {
  config[os.style.StyleField.SHOW_ERROR] = value;
  os.command.VectorLayerShowError.base(this, 'applyValue', config, value);
};
