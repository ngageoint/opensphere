goog.provide('os.command.FeatureStrokeOpacity');

goog.require('os.command.AbstractFeatureStyle');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.metrics');
goog.require('os.ui');



/**
 * Changes the stroke opacity of a feature
 * @extends {os.command.AbstractFeatureStyle}
 * @param {string} layerId
 * @param {string} featureId
 * @param {number} opacity
 * @param {number=} opt_oldOpacity
 * @constructor
 */
os.command.FeatureStrokeOpacity = function(layerId, featureId, opacity, opt_oldOpacity) {
  os.command.FeatureStrokeOpacity.base(this, 'constructor', layerId, featureId, opacity, opt_oldOpacity);
  this.title = 'Change Feature Stroke Opacity';
  this.metricKey = os.metrics.Layer.FEATURE_STROKE_OPACITY;

  if (!opacity) {
    var feature = this.getFeature();
    var config = /** @type {Object|undefined} */ (feature.get(os.style.StyleType.FEATURE));

    if (config) {
      if (goog.isArray(config)) {
        config = config[0];
      }
      opacity = /** @type {number} */ (os.style.getConfigOpacityColor(config));
    }
  }

  this.value = opacity;
};
goog.inherits(os.command.FeatureStrokeOpacity, os.command.AbstractFeatureStyle);


/**
 * @type {number}
 * @const
 */
os.command.FeatureStrokeOpacity.DEFAULT_OPACITY = 1;


/**
 * @inheritDoc
 */
os.command.FeatureStrokeOpacity.prototype.getOldValue = function() {
  var feature = /** @type {ol.Feature} */ (this.getFeature());
  var config = /** @type {Array<Object>|Object|undefined} */ (this.getFeatureConfigs(feature));
  if (goog.isArray(config)) {
    config = config[0];
  }

  return config ? os.style.getConfigOpacityColor(config) : os.command.FeatureStrokeOpacity.DEFAULT_OPACITY;
};


/**
 * @inheritDoc
 */
os.command.FeatureStrokeOpacity.prototype.applyValue = function(configs, value) {
  var color;

  for (var i = 0; i < configs.length; i++) {
    color = os.style.getConfigColor(configs[i], true, os.style.StyleField.STROKE);
    color[3] = value;
    os.style.setConfigColor(configs[i], color, [os.style.StyleField.STROKE, os.style.StyleField.IMAGE]);
  }

  os.command.FeatureStrokeOpacity.base(this, 'applyValue', configs, value);
};
