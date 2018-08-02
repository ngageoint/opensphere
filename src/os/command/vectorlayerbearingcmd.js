goog.provide('os.command.VectorLayerBearing');

goog.require('os.command.AbstractVectorLayerLOB');
goog.require('os.metrics');



/**
 * Changes the lob bearing column
 * @param {string} layerId
 * @param {string} value
 * @param {string=} opt_oldValue
 * @extends {os.command.AbstractVectorLayerLOB<string>}
 * @constructor
 */
os.command.VectorLayerBearing = function(layerId, value, opt_oldValue) {
  os.command.VectorLayerBearing.base(this, 'constructor', layerId, value, opt_oldValue);
  this.title = 'Change bearing column';
  this.value = value || '';
  this.metricKey = os.metrics.Layer.VECTOR_LOB_BEARING_COLUMN;
};
goog.inherits(os.command.VectorLayerBearing, os.command.AbstractVectorLayerLOB);


/**
 * @inheritDoc
 */
os.command.VectorLayerBearing.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return config && config[os.style.StyleField.LOB_BEARING_COLUMN] || '';
};


/**
 * @inheritDoc
 */
os.command.VectorLayerBearing.prototype.applyValue = function(config, value) {
  config[os.style.StyleField.LOB_BEARING_COLUMN] = value;

  os.command.VectorLayerBearing.base(this, 'applyValue', config, value);
};
