goog.provide('os.command.FeatureLineDash');

goog.require('os.command.AbstractFeatureStyle');
goog.require('os.command.ICommand');
goog.require('os.metrics');


/**
 * Changes the line dash of a feature
 * @extends {os.command.AbstractFeatureStyle}
 * @param {string} layerId
 * @param {string} featureId
 * @param {Array<number>} lineDash
 * @param {Array<number>=} opt_oldLineDash
 * @constructor
 */
os.command.FeatureLineDash = function(layerId, featureId, lineDash, opt_oldLineDash) {
  os.command.FeatureLineDash.base(this, 'constructor', layerId, featureId, lineDash, opt_oldLineDash);
  this.title = 'Change Feature Line Dash';
  this.metricKey = os.metrics.Layer.FEATURE_LINE_DASH;
};
goog.inherits(os.command.FeatureLineDash, os.command.AbstractFeatureStyle);


/**
 * @inheritDoc
 */
os.command.FeatureLineDash.prototype.getOldValue = function() {
  var feature = /** @type {ol.Feature} */ (this.getFeature());
  var config = /** @type {Array<Object>|Object|undefined} */ (this.getFeatureConfigs(feature));
  if (goog.isArray(config)) {
    config = config[0];
  }

  return os.style.getConfigLineDash(config);
};


/**
 * @inheritDoc
 */
os.command.FeatureLineDash.prototype.applyValue = function(configs, value) {
  var lineDash = /** @type {Array<number>} */ (value);
  for (var i = 0; i < configs.length; i++) {
    os.style.setConfigLineDash(configs[i], lineDash);
  }

  os.command.FeatureLineDash.base(this, 'applyValue', configs, value);
};
