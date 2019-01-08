goog.provide('os.command.FeatureLabelSize');

goog.require('os.command.AbstractFeatureStyle');
goog.require('os.metrics');
goog.require('os.style.label');



/**
 * Changes the label size for a feature
 * @param {string} layerId
 * @param {string} featureId
 * @param {number} value
 * @param {number=} opt_oldValue
 * @extends {os.command.AbstractFeatureStyle<number>}
 * @constructor
 */
os.command.FeatureLabelSize = function(layerId, featureId, value, opt_oldValue) {
  os.command.FeatureLabelSize.base(this, 'constructor', layerId, featureId, value, opt_oldValue);
  this.title = 'Change Feature Label Size';
  this.metricKey = os.metrics.Layer.FEATURE_LABEL_SIZE;
};
goog.inherits(os.command.FeatureLabelSize, os.command.AbstractFeatureStyle);


/**
 * @inheritDoc
 */
os.command.FeatureLabelSize.prototype.getOldValue = function() {
  var feature = /** @type {ol.Feature} */ (this.getFeature());
  var labelSize = feature.get(os.style.StyleField.LABEL_SIZE);
  return labelSize ? labelSize : os.style.label.DEFAULT_SIZE;
};


/**
 * @inheritDoc
 */
os.command.FeatureLabelSize.prototype.applyValue = function(configs, value) {
  var feature = /** @type {ol.Feature} */ (this.getFeature());
  feature.set(os.style.StyleField.LABEL_SIZE, value);

  for (var i = 0; i < configs.length; i++) {
    configs[i][os.style.StyleField.LABEL_SIZE] = value;
  }

  os.command.FeatureLabelSize.base(this, 'applyValue', configs, value);
};


/**
 * @inheritDoc
 */
os.command.FeatureLabelSize.prototype.finish = function(config) {
  // label overlap will likely change, so update them
  os.style.label.updateShown();
  os.command.FeatureLabelSize.base(this, 'finish', config);
};
