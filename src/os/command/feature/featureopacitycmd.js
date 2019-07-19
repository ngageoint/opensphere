goog.provide('os.command.FeatureOpacity');

goog.require('os.command.AbstractFeatureStyle');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.metrics');
goog.require('os.ui');



/**
 * Changes the opacity of a feature
 *
 * @extends {os.command.AbstractFeatureStyle}
 * @param {string} layerId
 * @param {string} featureId
 * @param {number} opacity
 * @param {number=} opt_oldOpacity
 * @constructor
 */
os.command.FeatureOpacity = function(layerId, featureId, opacity, opt_oldOpacity) {
  os.command.FeatureOpacity.base(this, 'constructor', layerId, featureId, opacity, opt_oldOpacity);
  this.title = 'Change Feature Opacity';
  this.metricKey = os.metrics.Layer.FEATURE_OPACITY;

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
goog.inherits(os.command.FeatureOpacity, os.command.AbstractFeatureStyle);


/**
 * @type {number}
 * @const
 */
os.command.FeatureOpacity.DEFAULT_OPACITY = 1;


/**
 * @inheritDoc
 */
os.command.FeatureOpacity.prototype.getOldValue = function() {
  var feature = /** @type {ol.Feature} */ (this.getFeature());
  var config = /** @type {Array<Object>|Object|undefined} */ (this.getFeatureConfigs(feature));
  if (goog.isArray(config)) {
    config = config[0];
  }

  return config ? os.style.getConfigOpacityColor(config) : os.command.FeatureOpacity.DEFAULT_OPACITY;
};


/**
 * @inheritDoc
 */
os.command.FeatureOpacity.prototype.applyValue = function(configs, value) {
  for (var i = 0; i < configs.length; i++) {
    os.style.setConfigOpacityColor(configs[i], value);
  }

  os.command.FeatureOpacity.base(this, 'applyValue', configs, value);
};


/**
 * @inheritDoc
 */
os.command.FeatureOpacity.prototype.finish = function(configs) {
  // dispatch the color change event on the source for the histogram
  var feature = this.getFeature();

  feature.dispatchEvent(new os.events.PropertyChangeEvent('colors'));

  os.command.FeatureOpacity.base(this, 'finish', configs);
};
