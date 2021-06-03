goog.module('os.command.FeatureLabel');
goog.module.declareLegacyNamespace();

const AbstractFeatureStyle = goog.require('os.command.AbstractFeatureStyle');
const metrics = goog.require('os.metrics');
const label = goog.require('os.style.label');


/**
 * Changes the label field for a feature
 *
 * @extends {AbstractFeatureStyle<string>}
 */
class FeatureLabel extends AbstractFeatureStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} featureId
   * @param {Array<label.LabelConfig>} value
   * @param {Array<os.style.label.LabelConfig>=} opt_oldValue
   */
  constructor(layerId, featureId, value, opt_oldValue) {
    super(layerId, featureId, value, opt_oldValue);
    this.title = 'Change Feature Label';
    this.metricKey = metrics.Layer.FEATURE_LABEL_COLUMN_SELECT;

    /**
     * @type {Array<label.LabelConfig>}
     */
    this.value = value || [label.cloneConfig()];
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var feature = /** @type {ol.Feature} */ (this.getFeature());
    var config = /** @type {Array<Object>|Object|undefined} */ (this.getFeatureConfigs(feature));
    var labelColumns = [];
    if (config) {
      if (Array.isArray(config)) {
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
  }

  /**
   * @inheritDoc
   */
  applyValue(configs, value) {
    for (var i = 0; i < configs.length; i++) {
      configs[i][os.style.StyleField.LABELS] = value;
    }

    super.applyValue(configs, value);
  }

  /**
   * @inheritDoc
   */
  finish(configs) {
    // label overlap will likely change, so update them
    label.updateShown();
    super.finish(configs);
  }
}

exports = FeatureLabel;
