goog.provide('os.command.VectorLayerBearingError');

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
os.command.VectorLayerBearingError = function(layerId, value, opt_oldValue) {
  os.command.VectorLayerBearingError.base(this, 'constructor', layerId, value, opt_oldValue);
  this.title = 'Change Line of Bearing error multiplier';
  this.value = value;
  this.metricKey = os.metrics.Layer.VECTOR_LOB_BEARING_ERROR;
};
goog.inherits(os.command.VectorLayerBearingError, os.command.AbstractVectorLayerLOB);


/**
 * @inheritDoc
 */
os.command.VectorLayerBearingError.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return config ? config[os.style.StyleField.LOB_BEARING_ERROR] : os.style.DEFAULT_LOB_BEARING_ERROR;
};


/**
 * @inheritDoc
 */
os.command.VectorLayerBearingError.prototype.applyValue = function(config, value) {
  config[os.style.StyleField.LOB_BEARING_ERROR] = value;
  os.command.VectorLayerBearingError.base(this, 'applyValue', config, value);
};
