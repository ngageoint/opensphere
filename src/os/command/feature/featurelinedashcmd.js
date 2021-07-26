goog.module('os.command.FeatureLineDash');
goog.module.declareLegacyNamespace();

const AbstractFeatureStyle = goog.require('os.command.AbstractFeatureStyle');
const {Layer: LayerKeys} = goog.require('os.metrics.keys');
const osStyle = goog.require('os.style');

const Feature = goog.requireType('ol.Feature');


/**
 * Changes the line dash of a feature
 */
class FeatureLineDash extends AbstractFeatureStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} featureId
   * @param {Array<number>} lineDash
   * @param {Array<number>=} opt_oldLineDash
   */
  constructor(layerId, featureId, lineDash, opt_oldLineDash) {
    super(layerId, featureId, lineDash, opt_oldLineDash);
    this.title = 'Change Feature Line Dash';
    this.metricKey = LayerKeys.FEATURE_LINE_DASH;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var feature = /** @type {Feature} */ (this.getFeature());
    if (feature == null) {
      return null;
    }

    var config = /** @type {Array<Object>|Object|undefined} */ (this.getFeatureConfigs(feature));
    if (Array.isArray(config)) {
      config = config[0];
    }

    return osStyle.getConfigLineDash(config);
  }

  /**
   * @inheritDoc
   */
  applyValue(configs, value) {
    var lineDash = /** @type {Array<number>} */ (value);
    for (var i = 0; i < configs.length; i++) {
      osStyle.setConfigLineDash(configs[i], lineDash);
    }

    super.applyValue(configs, value);
  }
}

exports = FeatureLineDash;
