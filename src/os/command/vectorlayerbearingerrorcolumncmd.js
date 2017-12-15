goog.provide('os.command.VectorLayerBearingErrorColumn');

goog.require('os.command.AbstractVectorLayerLOB');
goog.require('os.metrics');



/**
 * Changes the lob bearing error column
 * @param {string} layerId
 * @param {string} value
 * @param {string=} opt_oldValue
 * @extends {os.command.AbstractVectorLayerLOB<string>}
 * @constructor
 */
os.command.VectorLayerBearingErrorColumn = function(layerId, value, opt_oldValue) {
  os.command.VectorLayerBearingErrorColumn.base(this, 'constructor', layerId, value, opt_oldValue);
  this.title = 'Change bearing error column';
  this.value = value || '';
  this.metricKey = os.metrics.Layer.VECTOR_LOB_BEARING_ERROR_COLUMN;
};
goog.inherits(os.command.VectorLayerBearingErrorColumn, os.command.AbstractVectorLayerLOB);


/**
 * @inheritDoc
 */
os.command.VectorLayerBearingErrorColumn.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return config && config[os.style.StyleField.LOB_BEARING_ERROR_COLUMN] || '';
};


/**
 * @inheritDoc
 */
os.command.VectorLayerBearingErrorColumn.prototype.applyValue = function(config, value) {
  config[os.style.StyleField.LOB_BEARING_ERROR_COLUMN] = value;

  os.command.VectorLayerBearingErrorColumn.base(this, 'applyValue', config, value);
};
