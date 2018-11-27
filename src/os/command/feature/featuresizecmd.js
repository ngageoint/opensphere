goog.provide('os.command.FeatureSize');

goog.require('os.command.AbstractFeatureStyle');
goog.require('os.command.ICommand');
goog.require('os.metrics');


/**
 * Changes the size of a feature
 * @extends {os.command.AbstractFeatureStyle}
 * @param {string} layerId
 * @param {string} featureId
 * @param {number} size
 * @param {number=} opt_oldSize
 * @constructor
 */
os.command.FeatureSize = function(layerId, featureId, size, opt_oldSize) {
  os.command.FeatureSize.base(this, 'constructor', layerId, featureId, size, opt_oldSize);
  this.title = 'Change Feature Size';
  this.metricKey = os.metrics.Layer.FEATURE_SIZE;
};
goog.inherits(os.command.FeatureSize, os.command.AbstractFeatureStyle);


/**
 * @inheritDoc
 */
os.command.FeatureSize.prototype.getOldValue = function() {
  var feature = /** @type {ol.Feature} */ (this.getFeature());
  var config = /** @type {Array<Object>|Object|undefined} */ (this.getFeatureConfigs(feature));
  if (goog.isArray(config)) {
    config = config[0];
  }

  return os.style.getConfigSize(config);
};


/**
 * @inheritDoc
 */
os.command.FeatureSize.prototype.applyValue = function(configs, value) {
  var size = /** @type {number} */ (value);
  for (var i = 0; i < configs.length; i++) {
    os.style.setConfigSize(configs[i], size);
  }

  os.command.FeatureSize.base(this, 'applyValue', configs, value);
};
