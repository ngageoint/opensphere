goog.module('os.command.FeatureCenterShape');
goog.module.declareLegacyNamespace();

const AbstractFeatureStyle = goog.require('os.command.AbstractFeatureStyle');
const metrics = goog.require('os.metrics');


/**
 * Changes the center style of a feature
 */
class FeatureCenterShape extends AbstractFeatureStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} featureId
   * @param {string} value
   * @param {string=} opt_oldValue
   */
  constructor(layerId, featureId, value, opt_oldValue) {
    super(layerId, featureId, value, opt_oldValue);
    this.title = 'Change Feature Center Style';

    var type = value ? value.replace(/ /g, '_') : 'Unknown';
    this.metricKey = metrics.Layer.FEATURE_CENTER_SHAPE + metrics.SUB_DELIMITER + type;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var feature = /** @type {ol.Feature} */ (this.getFeature());
    var shape = feature.get(os.style.StyleField.CENTER_SHAPE);
    return shape ? shape : os.style.ShapeType.POINT;
  }

  /**
   * @inheritDoc
   */
  applyValue(configs, value) {
    var feature = /** @type {ol.Feature} */ (this.getFeature());
    feature.set(os.style.StyleField.CENTER_SHAPE, value);
    super.applyValue(configs, value);
  }
}

exports = FeatureCenterShape;
