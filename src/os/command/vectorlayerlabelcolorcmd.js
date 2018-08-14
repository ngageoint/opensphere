goog.provide('os.command.VectorLayerLabelColor');

goog.require('os.command.AbstractVectorStyle');
goog.require('os.metrics');



/**
 * Changes the label color for a layer
 * @param {string} layerId
 * @param {string} value
 * @param {string=} opt_oldValue
 * @extends {os.command.AbstractVectorStyle<string>}
 * @constructor
 */
os.command.VectorLayerLabelColor = function(layerId, value, opt_oldValue) {
  os.command.VectorLayerLabelColor.base(this, 'constructor', layerId, value, opt_oldValue);
  this.title = 'Change Label Color';
  this.metricKey = os.metrics.Layer.LABEL_COLOR;
  // make sure the value is an rgba string, not hex
  if (value != '') {
    this.value = os.style.toRgbaString(value);
  }
};
goog.inherits(os.command.VectorLayerLabelColor, os.command.AbstractVectorStyle);


/**
 * @inheritDoc
 */
os.command.VectorLayerLabelColor.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return config && config[os.style.StyleField.LABEL_COLOR] || '';
};


/**
 * @inheritDoc
 */
os.command.VectorLayerLabelColor.prototype.applyValue = function(config, value) {
  config[os.style.StyleField.LABEL_COLOR] = value;

  os.command.VectorLayerLabelColor.base(this, 'applyValue', config, value);
};
