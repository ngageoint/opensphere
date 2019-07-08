goog.provide('os.command.FeatureIcon');

goog.require('os.command.AbstractFeatureStyle');
goog.require('os.metrics');
goog.require('os.ui.file.kml');



/**
 * Configure a feature to display an icon.
 *
 * @param {string} layerId The layer id.
 * @param {string} featureId The feature id.
 * @param {osx.icon.Icon} icon The new icon.
 * @param {osx.icon.Icon=} opt_oldIcon The old icon.
 * @extends {os.command.AbstractFeatureStyle}
 * @constructor
 */
os.command.FeatureIcon = function(layerId, featureId, icon, opt_oldIcon) {
  os.command.FeatureIcon.base(this, 'constructor', layerId, featureId, icon, opt_oldIcon);
  this.title = 'Change Feature Icon';
  this.metricKey = os.metrics.Layer.FEATURE_ICON;
};
goog.inherits(os.command.FeatureIcon, os.command.AbstractFeatureStyle);


/**
 * @inheritDoc
 */
os.command.FeatureIcon.prototype.getOldValue = function() {
  var feature = /** @type {ol.Feature} */ (this.getFeature());
  var configs = /** @type {Array<Object>|Object|undefined} */ (this.getFeatureConfigs(feature));
  if (goog.isArray(configs)) {
    configs = configs.length > 1 ? configs[1] : configs[0];
  }

  return os.style.getConfigIcon(configs) || os.ui.file.kml.getDefaultIcon();
};


/**
 * @inheritDoc
 */
os.command.FeatureIcon.prototype.applyValue = function(configs, value) {
  if (value) {
    var config = configs.length > 1 ? configs[1] : configs[0]; // using 1 is specific to tracks
    os.style.setConfigIcon(config, value);
  }

  os.command.FeatureIcon.base(this, 'applyValue', configs, value);
};
