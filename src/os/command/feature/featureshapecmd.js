goog.provide('os.command.FeatureShape');

goog.require('os.command.AbstractFeatureStyle');
goog.require('os.metrics');



/**
 * Changes the style of a feature
 * @param {string} layerId
 * @param {string} featureId
 * @param {string} value
 * @param {string=} opt_oldValue
 * @extends {os.command.AbstractFeatureStyle}
 * @constructor
 */
os.command.FeatureShape = function(layerId, featureId, value, opt_oldValue) {
  os.command.FeatureShape.base(this, 'constructor', layerId, featureId, value, opt_oldValue);
  this.title = 'Change Feature Style';

  var type = value ? value.replace(/ /g, '_') : 'Unknown';
  this.metricKey = os.metrics.Layer.FEATURE_SHAPE + os.metrics.SUB_DELIMITER + type;
};
goog.inherits(os.command.FeatureShape, os.command.AbstractFeatureStyle);


/**
 * @inheritDoc
 */
os.command.FeatureShape.prototype.getOldValue = function() {
  var feature = /** @type {ol.Feature} */ (this.getFeature());
  var shape = feature.get(os.style.StyleField.SHAPE);
  return shape ? shape : os.style.ShapeType.POINT;
};


/**
 * @inheritDoc
 */
os.command.FeatureShape.prototype.applyValue = function(configs, value) {
  var feature = /** @type {ol.Feature} */ (this.getFeature());
  feature.set(os.style.StyleField.SHAPE, value);

  var config = /** @type {Array<Object>|Object|undefined} */ (this.getFeatureConfigs(feature));
  if (goog.isArray(config)) {
    config = config[0];
  }
  if (value == os.style.ShapeType.NONE) {
    config['geometry'] = os.ui.FeatureEditCtrl.HIDE_GEOMETRY;
  } else {
    delete config['geometry'];
  }
  os.command.FeatureShape.base(this, 'applyValue', configs, value);
};
