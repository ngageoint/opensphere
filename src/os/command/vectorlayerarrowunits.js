goog.provide('os.command.VectorLayerArrowUnits');

goog.require('os.command.AbstractVectorLayerLOB');
goog.require('os.metrics');



/**
 * Changes the lob length units
 * @param {string} layerId
 * @param {string} value
 * @param {string=} opt_oldValue
 * @extends {os.command.AbstractVectorLayerLOB<string>}
 * @constructor
 */
os.command.VectorLayerArrowUnits = function(layerId, value, opt_oldValue) {
  os.command.VectorLayerArrowUnits.base(this, 'constructor', layerId, value, opt_oldValue);
  this.title = 'Change arrow units';
  this.value = value || os.style.DEFAULT_UNITS;
  this.metricKey = os.metrics.Layer.VECTOR_ARROW_UNITS;
};
goog.inherits(os.command.VectorLayerArrowUnits, os.command.AbstractVectorLayerLOB);


/**
 * @inheritDoc
 */
os.command.VectorLayerArrowUnits.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return config && config[os.style.StyleField.ARROW_UNITS] || os.style.DEFAULT_UNITS;
};


/**
 * @inheritDoc
 */
os.command.VectorLayerArrowUnits.prototype.applyValue = function(config, value) {
  config[os.style.StyleField.ARROW_UNITS] = value;

  os.command.VectorLayerArrowUnits.base(this, 'applyValue', config, value);
};
