goog.module('os.command.FeatureLabel');
goog.module.declareLegacyNamespace();

const olArray = goog.require('ol.array');
const AbstractFeatureStyle = goog.require('os.command.AbstractFeatureStyle');
const metrics = goog.require('os.metrics');
const osStyle = goog.require('os.style');
const StyleField = goog.require('os.style.StyleField');
const label = goog.require('os.style.label');

const Feature = goog.requireType('ol.Feature');


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
   * @param {Array<label.LabelConfig>=} opt_oldValue
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
    var feature = /** @type {Feature} */ (this.getFeature());
    var config = /** @type {Array<Object>|Object|undefined} */ (this.getFeatureConfigs(feature));
    var labelColumns = [];
    if (config) {
      if (Array.isArray(config)) {
        // locate the label config in the array
        var labelsConfig = olArray.find(config, osStyle.isLabelConfig);
        if (labelsConfig) {
          labelColumns = labelsConfig[StyleField.LABELS];
        }
      } else if (config[StyleField.LABELS]) {
        labelColumns = config[StyleField.LABELS];
      }
    }
    return labelColumns;
  }

  /**
   * @inheritDoc
   */
  applyValue(configs, value) {
    for (var i = 0; i < configs.length; i++) {
      configs[i][StyleField.LABELS] = value;
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
