goog.provide('os.command.VectorLayerShowEllipse');

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
os.command.VectorLayerShowEllipse = function(layerId, value, opt_oldValue) {
  os.command.VectorLayerShowEllipse.base(this, 'constructor', layerId, value, opt_oldValue);
  this.metricKey = os.metrics.Layer.VECTOR_SHOW_ELLIPSE;

  // make sure the value is a boolean
  this.value = !!value;
  this.title = value ? 'Enable Show Ellipse' : 'Disable Show Ellipse';
};
goog.inherits(os.command.VectorLayerShowEllipse, os.command.AbstractVectorLayerLOB);


/**
 * @inheritDoc
 */
os.command.VectorLayerShowEllipse.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return config != null && config[os.style.StyleField.SHOW_ELLIPSE] || false;
};


/**
 * @inheritDoc
 */
os.command.VectorLayerShowEllipse.prototype.applyValue = function(config, value) {
  config[os.style.StyleField.SHOW_ELLIPSE] = value;
  os.command.VectorLayerShowEllipse.base(this, 'applyValue', config, value);
};
