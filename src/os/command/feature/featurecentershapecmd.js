goog.module('os.command.FeatureCenterShape');
goog.module.declareLegacyNamespace();

const AbstractFeatureStyle = goog.require('os.command.AbstractFeatureStyle');
const metrics = goog.require('os.metrics');
const osStyle = goog.require('os.style');
const StyleField = goog.require('os.style.StyleField');

const Feature = goog.requireType('ol.Feature');


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
    var feature = /** @type {Feature} */ (this.getFeature());
    var shape = feature.get(StyleField.CENTER_SHAPE);
    return shape ? shape : osStyle.ShapeType.POINT;
  }

  /**
   * @inheritDoc
   */
  applyValue(configs, value) {
    var feature = /** @type {Feature} */ (this.getFeature());
    feature.set(StyleField.CENTER_SHAPE, value);
    super.applyValue(configs, value);
  }
}

exports = FeatureCenterShape;
