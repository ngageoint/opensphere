goog.provide('os.command.FeatureLabelColor');

goog.require('os.command.AbstractFeatureStyle');
goog.require('os.metrics');



/**
 * Changes the label color for a feature
 *
 * @param {string} layerId
 * @param {string} featureId
 * @param {string} value
 * @param {string=} opt_oldValue
 * @extends {os.command.AbstractFeatureStyle<string>}
 * @constructor
 */
os.command.FeatureLabelColor = function(layerId, featureId, value, opt_oldValue) {
  os.command.FeatureLabelColor.base(this, 'constructor', layerId, featureId, value, opt_oldValue);
  this.title = 'Change Feature Label Color';
  this.metricKey = os.metrics.Layer.FEATURE_LABEL_COLOR;
  // make sure the value is an rgba string, not hex
  if (value != '') {
    this.value = os.style.toRgbaString(value);
  }
};
goog.inherits(os.command.FeatureLabelColor, os.command.AbstractFeatureStyle);


/**
 * @inheritDoc
 */
os.command.FeatureLabelColor.prototype.getOldValue = function() {
  var feature = /** @type {ol.Feature} */ (this.getFeature());
  var labelColor = feature.get(os.style.StyleField.LABEL_COLOR);
  return labelColor ? labelColor : os.style.DEFAULT_LAYER_COLOR;
};


/**
 * @inheritDoc
 */
os.command.FeatureLabelColor.prototype.applyValue = function(configs, value) {
  var feature = /** @type {ol.Feature} */ (this.getFeature());
  feature.set(os.style.StyleField.LABEL_COLOR, value);

  for (var i = 0; i < configs.length; i++) {
    configs[i][os.style.StyleField.LABEL_COLOR] = value;
  }

  os.command.FeatureLabelColor.base(this, 'applyValue', configs, value);
};
