goog.module('os.command.FeatureLabelSize');

const AbstractFeatureStyle = goog.require('os.command.AbstractFeatureStyle');
const {Layer: LayerKeys} = goog.require('os.metrics.keys');
const StyleField = goog.require('os.style.StyleField');
const label = goog.require('os.style.label');

const Feature = goog.requireType('ol.Feature');


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
    this.metricKey = LayerKeys.FEATURE_LABEL_SIZE;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var feature = /** @type {Feature} */ (this.getFeature());
    if (feature == null) {
      return null;
    }

    var labelSize = feature.get(StyleField.LABEL_SIZE);
    return labelSize ? labelSize : label.DEFAULT_SIZE;
  }

  /**
   * @inheritDoc
   */
  applyValue(configs, value) {
    var feature = /** @type {Feature} */ (this.getFeature());
    feature.set(StyleField.LABEL_SIZE, value);

    for (var i = 0; i < configs.length; i++) {
      configs[i][StyleField.LABEL_SIZE] = value;
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
