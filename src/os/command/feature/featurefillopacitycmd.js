goog.provide('os.command.FeatureFillOpacity');

goog.require('os.command.AbstractFeatureStyle');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.metrics');
goog.require('os.ui');



/**
 * Changes the fill opacity of a feature
 * @extends {os.command.AbstractFeatureStyle}
 * @param {string} layerId
 * @param {string} featureId
 * @param {number} opacity
 * @param {number=} opt_oldOpacity
 * @constructor
 */
os.command.FeatureFillOpacity = function(layerId, featureId, opacity, opt_oldOpacity) {
  os.command.FeatureFillOpacity.base(this, 'constructor', layerId, featureId, opacity, opt_oldOpacity);
  this.title = 'Change Feature Fill Opacity';
  this.metricKey = os.metrics.Layer.FEATURE_FILL_OPACITY;

  this.value = opacity;
};
goog.inherits(os.command.FeatureFillOpacity, os.command.AbstractFeatureStyle);


/**
 * @type {number}
 * @const
 */
os.command.FeatureFillOpacity.DEFAULT_OPACITY = 1;


/**
 * @inheritDoc
 */
os.command.FeatureFillOpacity.prototype.getOldValue = function() {
  var feature = this.getFeature();
  var config = /** @type {Array<Object>|Object|undefined} */ (this.getFeatureConfigs(feature));
  if (goog.isArray(config)) {
    config = config[0];
  }

  return config ? os.style.getConfigOpacityColor(config) : os.command.FeatureFillOpacity.DEFAULT_OPACITY;
};


/**
 * @inheritDoc
 */
os.command.FeatureFillOpacity.prototype.applyValue = function(configs, value) {
  var color;
  for (var i = 0; i < configs.length; i++) {
    color = os.style.getConfigColor(configs[i], true, os.style.StyleField.FILL);
    color[3] = value;
    os.style.setConfigColor(configs[i], color, [os.style.StyleField.FILL]);
  }

  os.command.FeatureFillOpacity.base(this, 'applyValue', configs, value);
};


/**
 * @inheritDoc
 */
os.command.FeatureFillOpacity.prototype.finish = function(configs) {
  // dispatch the color change event on the source for the histogram
  var feature = this.getFeature();

  feature.dispatchEvent(new os.events.PropertyChangeEvent('colors'));

  os.command.FeatureFillOpacity.base(this, 'finish', configs);
};
