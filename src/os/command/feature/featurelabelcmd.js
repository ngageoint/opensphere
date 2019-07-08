goog.provide('os.command.FeatureLabel');

goog.require('os.command.AbstractFeatureStyle');
goog.require('os.metrics');
goog.require('os.style.label');



/**
 * Changes the label field for a feature
 *
 * @param {string} layerId
 * @param {string} featureId
 * @param {Array<os.style.label.LabelConfig>} value
 * @param {Array<os.style.label.LabelConfig>=} opt_oldValue
 * @extends {os.command.AbstractFeatureStyle<string>}
 * @constructor
 */
os.command.FeatureLabel = function(layerId, featureId, value, opt_oldValue) {
  os.command.FeatureLabel.base(this, 'constructor', layerId, featureId, value, opt_oldValue);
  this.title = 'Change Feature Label';
  this.metricKey = os.metrics.Layer.FEATURE_LABEL_COLUMN_SELECT;

  /**
   * @type {Array<os.style.label.LabelConfig>}
   */
  this.value = value || [os.style.label.cloneConfig()];
};
goog.inherits(os.command.FeatureLabel, os.command.AbstractFeatureStyle);


/**
 * @inheritDoc
 */
os.command.FeatureLabel.prototype.getOldValue = function() {
  var feature = /** @type {ol.Feature} */ (this.getFeature());
  var config = /** @type {Array<Object>|Object|undefined} */ (this.getFeatureConfigs(feature));
  var labelColumns = [];
  if (config) {
    if (goog.isArray(config)) {
      // locate the label config in the array
      var labelsConfig = ol.array.find(config, os.style.isLabelConfig);
      if (labelsConfig) {
        labelColumns = labelsConfig[os.style.StyleField.LABELS];
      }
    } else if (config[os.style.StyleField.LABELS]) {
      labelColumns = config[os.style.StyleField.LABELS];
    }
  }
  return labelColumns;
};


/**
 * @inheritDoc
 */
os.command.FeatureLabel.prototype.applyValue = function(configs, value) {
  for (var i = 0; i < configs.length; i++) {
    configs[i][os.style.StyleField.LABELS] = value;
  }

  os.command.FeatureLabel.base(this, 'applyValue', configs, value);
};


/**
 * @inheritDoc
 */
os.command.FeatureLabel.prototype.finish = function(configs) {
  // label overlap will likely change, so update them
  os.style.label.updateShown();
  os.command.FeatureLabel.base(this, 'finish', configs);
};
