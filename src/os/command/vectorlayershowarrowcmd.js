goog.provide('os.command.VectorLayerShowArrow');

goog.require('os.command.AbstractVectorLayerLOB');
goog.require('os.metrics');



/**
 * Changes if lob arrows are shown.
 * @param {string} layerId
 * @param {boolean} value
 * @param {boolean=} opt_oldValue
 * @extends {os.command.AbstractVectorLayerLOB<boolean>}
 * @constructor
 */
os.command.VectorLayerShowArrow = function(layerId, value, opt_oldValue) {
  os.command.VectorLayerShowArrow.base(this, 'constructor', layerId, value, opt_oldValue);
  this.metricKey = os.metrics.Layer.VECTOR_SHOW_ARROW;

  // make sure the value is a boolean
  this.value = !!value;
  this.title = value ? 'Enable Arrow' : 'Disable Arrow';
};
goog.inherits(os.command.VectorLayerShowArrow, os.command.AbstractVectorLayerLOB);


/**
 * @inheritDoc
 */
os.command.VectorLayerShowArrow.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return config != null && config[os.style.StyleField.SHOW_ARROW] || false;
};


/**
 * @inheritDoc
 */
os.command.VectorLayerShowArrow.prototype.applyValue = function(config, value) {
  config[os.style.StyleField.SHOW_ARROW] = value;
  os.command.VectorLayerShowArrow.base(this, 'applyValue', config, value);
};
