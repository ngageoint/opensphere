goog.provide('os.command.VectorLayerLabelSize');

goog.require('os.command.AbstractVectorStyle');
goog.require('os.metrics');



/**
 * Changes the label size for a layer
 * @param {string} layerId
 * @param {number} value
 * @param {number=} opt_oldValue
 * @extends {os.command.AbstractVectorStyle<number>}
 * @constructor
 */
os.command.VectorLayerLabelSize = function(layerId, value, opt_oldValue) {
  os.command.VectorLayerLabelSize.base(this, 'constructor', layerId, value, opt_oldValue);
  this.title = 'Change Label Size';
  this.metricKey = os.metrics.Layer.LABEL_SIZE;
};
goog.inherits(os.command.VectorLayerLabelSize, os.command.AbstractVectorStyle);


/**
 * @inheritDoc
 */
os.command.VectorLayerLabelSize.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return config ? config[os.style.StyleField.LABEL_SIZE] : undefined;
};


/**
 * @inheritDoc
 */
os.command.VectorLayerLabelSize.prototype.applyValue = function(config, value) {
  config[os.style.StyleField.LABEL_SIZE] = value;

  os.command.VectorLayerLabelSize.base(this, 'applyValue', config, value);
};


/**
 * @inheritDoc
 */
os.command.VectorLayerLabelSize.prototype.finish = function(config) {
  // label overlap will likely change, so update them
  os.style.label.updateShown();
  os.command.VectorLayerLabelSize.base(this, 'finish', config);
};
