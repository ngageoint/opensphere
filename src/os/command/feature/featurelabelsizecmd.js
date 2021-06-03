goog.module('os.command.FeatureLabelSize');
goog.module.declareLegacyNamespace();

const AbstractFeatureStyle = goog.require('os.command.AbstractFeatureStyle');
const metrics = goog.require('os.metrics');
const label = goog.require('os.style.label');


/**
 * Changes the label size for a feature
 *
 * @extends {AbstractFeatureStyle<number>}
 */
class FeatureLabelSize extends AbstractFeatureStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} featureId
   * @param {number} value
   * @param {number=} opt_oldValue
   */
  constructor(layerId, featureId, value, opt_oldValue) {
    super(layerId, featureId, value, opt_oldValue);
    this.title = 'Change Feature Label Size';
    this.metricKey = metrics.Layer.FEATURE_LABEL_SIZE;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var feature = /** @type {ol.Feature} */ (this.getFeature());
    var labelSize = feature.get(os.style.StyleField.LABEL_SIZE);
    return labelSize ? labelSize : label.DEFAULT_SIZE;
  }

  /**
   * @inheritDoc
   */
  applyValue(configs, value) {
    var feature = /** @type {ol.Feature} */ (this.getFeature());
    feature.set(os.style.StyleField.LABEL_SIZE, value);

    for (var i = 0; i < configs.length; i++) {
      configs[i][os.style.StyleField.LABEL_SIZE] = value;
    }

    super.applyValue(configs, value);
  }

  /**
   * @inheritDoc
   */
  finish(config) {
    // label overlap will likely change, so update them
    label.updateShown();
    super.finish(config);
  }
}

exports = FeatureLabelSize;
