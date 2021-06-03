goog.module('os.command.FeatureShape');
goog.module.declareLegacyNamespace();

const AbstractFeatureStyle = goog.require('os.command.AbstractFeatureStyle');
const metrics = goog.require('os.metrics');


/**
 * Changes the style of a feature
 */
class FeatureShape extends AbstractFeatureStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} featureId
   * @param {string} value
   * @param {string=} opt_oldValue
   */
  constructor(layerId, featureId, value, opt_oldValue) {
    super(layerId, featureId, value, opt_oldValue);
    this.title = 'Change Feature Style';

    var type = value ? value.replace(/ /g, '_') : 'Unknown';
    this.metricKey = metrics.Layer.FEATURE_SHAPE + metrics.SUB_DELIMITER + type;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var feature = /** @type {ol.Feature} */ (this.getFeature());
    var shape = feature.get(os.style.StyleField.SHAPE);
    return shape ? shape : os.style.ShapeType.POINT;
  }

  /**
   * @inheritDoc
   */
  applyValue(configs, value) {
    var feature = /** @type {ol.Feature} */ (this.getFeature());
    feature.set(os.style.StyleField.SHAPE, value);

    var config = /** @type {Array<Object>|Object|undefined} */ (this.getFeatureConfigs(feature));
    if (Array.isArray(config)) {
      config = config[0];
    }
    if (value == os.style.ShapeType.NONE) {
      config['geometry'] = os.ui.FeatureEditCtrl.HIDE_GEOMETRY;
    } else {
      delete config['geometry'];
    }
    super.applyValue(configs, value);
  }
}

exports = FeatureShape;
