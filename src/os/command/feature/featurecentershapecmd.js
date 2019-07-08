goog.provide('os.command.FeatureCenterShape');

goog.require('os.command.AbstractFeatureStyle');
goog.require('os.metrics');



/**
 * Changes the center style of a feature
 *
 * @param {string} layerId
 * @param {string} featureId
 * @param {string} value
 * @param {string=} opt_oldValue
 * @extends {os.command.AbstractFeatureStyle}
 * @constructor
 */
os.command.FeatureCenterShape = function(layerId, featureId, value, opt_oldValue) {
  os.command.FeatureCenterShape.base(this, 'constructor', layerId, featureId, value, opt_oldValue);
  this.title = 'Change Feature Center Style';

  var type = value ? value.replace(/ /g, '_') : 'Unknown';
  this.metricKey = os.metrics.Layer.FEATURE_CENTER_SHAPE + os.metrics.SUB_DELIMITER + type;
};
goog.inherits(os.command.FeatureCenterShape, os.command.AbstractFeatureStyle);


/**
 * @inheritDoc
 */
os.command.FeatureCenterShape.prototype.getOldValue = function() {
  var feature = /** @type {ol.Feature} */ (this.getFeature());
  var shape = feature.get(os.style.StyleField.CENTER_SHAPE);
  return shape ? shape : os.style.ShapeType.POINT;
};


/**
 * @inheritDoc
 */
os.command.FeatureCenterShape.prototype.applyValue = function(configs, value) {
  var feature = /** @type {ol.Feature} */ (this.getFeature());
  feature.set(os.style.StyleField.CENTER_SHAPE, value);
  os.command.FeatureCenterShape.base(this, 'applyValue', configs, value);
};
