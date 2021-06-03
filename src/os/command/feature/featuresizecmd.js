goog.module('os.command.FeatureSize');
goog.module.declareLegacyNamespace();

const AbstractFeatureStyle = goog.require('os.command.AbstractFeatureStyle');
const metrics = goog.require('os.metrics');


/**
 * Changes the size of a feature
 */
class FeatureSize extends AbstractFeatureStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} featureId
   * @param {number} size
   * @param {number=} opt_oldSize
   */
  constructor(layerId, featureId, size, opt_oldSize) {
    super(layerId, featureId, size, opt_oldSize);
    this.title = 'Change Feature Size';
    this.metricKey = metrics.Layer.FEATURE_SIZE;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var feature = /** @type {ol.Feature} */ (this.getFeature());
    var config = /** @type {Array<Object>|Object|undefined} */ (this.getFeatureConfigs(feature));
    if (Array.isArray(config)) {
      config = config[0];
    }

    return os.style.getConfigSize(config);
  }

  /**
   * @inheritDoc
   */
  applyValue(configs, value) {
    var size = /** @type {number} */ (value);
    for (var i = 0; i < configs.length; i++) {
      os.style.setConfigSize(configs[i], size);
    }

    super.applyValue(configs, value);
  }
}

exports = FeatureSize;
