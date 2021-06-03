goog.module('os.command.FeatureLabelColor');
goog.module.declareLegacyNamespace();

const AbstractFeatureStyle = goog.require('os.command.AbstractFeatureStyle');
const metrics = goog.require('os.metrics');


/**
 * Changes the label color for a feature
 *
 * @extends {AbstractFeatureStyle<string>}
 */
class FeatureLabelColor extends AbstractFeatureStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} featureId
   * @param {string} value
   * @param {string=} opt_oldValue
   */
  constructor(layerId, featureId, value, opt_oldValue) {
    super(layerId, featureId, value, opt_oldValue);
    this.title = 'Change Feature Label Color';
    this.metricKey = metrics.Layer.FEATURE_LABEL_COLOR;
    // make sure the value is an rgba string, not hex
    if (value != '') {
      this.value = os.style.toRgbaString(value);
    }
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var feature = /** @type {ol.Feature} */ (this.getFeature());
    var labelColor = feature.get(os.style.StyleField.LABEL_COLOR);
    return labelColor ? labelColor : os.style.DEFAULT_LAYER_COLOR;
  }

  /**
   * @inheritDoc
   */
  applyValue(configs, value) {
    var feature = /** @type {ol.Feature} */ (this.getFeature());
    feature.set(os.style.StyleField.LABEL_COLOR, value);

    for (var i = 0; i < configs.length; i++) {
      configs[i][os.style.StyleField.LABEL_COLOR] = value;
    }

    super.applyValue(configs, value);
  }
}

exports = FeatureLabelColor;
