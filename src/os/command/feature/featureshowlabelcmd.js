goog.provide('os.command.FeatureShowLabel');

goog.require('os.command.AbstractFeatureStyle');
goog.require('os.metrics');
goog.require('os.style.label');



/**
 * Changes if labels are always shown for a feature, or on highlight only.
 *
 * @param {string} layerId
 * @param {string} featureId
 * @param {boolean} value
 * @param {boolean=} opt_oldValue
 * @extends {os.command.AbstractFeatureStyle}
 * @constructor
 */
os.command.FeatureShowLabel = function(layerId, featureId, value, opt_oldValue) {
  os.command.FeatureShowLabel.base(this, 'constructor', layerId, featureId, value, opt_oldValue);
  this.metricKey = os.metrics.Layer.FEATURE_LABEL_TOGGLE;
  // make sure the value is a boolean
  this.value = value || false;
  this.title = value ? 'Show Feature Labels' : 'Hide Feature Labels';
};
goog.inherits(os.command.FeatureShowLabel, os.command.AbstractFeatureStyle);


/**
 * @inheritDoc
 */
os.command.FeatureShowLabel.prototype.getOldValue = function() {
  var feature = /** @type {ol.Feature} */ (this.getFeature());
  var showLabels = feature.get(os.style.StyleField.SHOW_LABELS);
  return showLabels ? showLabels : true;
};


/**
 * @inheritDoc
 */
os.command.FeatureShowLabel.prototype.applyValue = function(configs, value) {
  var feature = /** @type {ol.Feature} */ (this.getFeature());
  feature.set(os.style.StyleField.SHOW_LABELS, value);
  os.command.FeatureShowLabel.base(this, 'applyValue', configs, value);
};


/**
 * @inheritDoc
 */
os.command.FeatureShowLabel.prototype.finish = function(configs) {
  // label overlap will likely change, so update them
  os.style.label.updateShown();
  os.command.FeatureShowLabel.base(this, 'finish', configs);
};
