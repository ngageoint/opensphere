goog.module('os.command.FeatureShape');
goog.module.declareLegacyNamespace();

const AbstractFeatureStyle = goog.require('os.command.AbstractFeatureStyle');
const metrics = goog.require('os.metrics');
const osStyle = goog.require('os.style');
const StyleField = goog.require('os.style.StyleField');
const FeatureEditCtrl = goog.require('os.ui.FeatureEditCtrl');

const Feature = goog.requireType('ol.Feature');


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
    var feature = /** @type {Feature} */ (this.getFeature());
    if (feature == null) {
      return null;
    }

    var shape = feature.get(StyleField.SHAPE);
    return shape ? shape : osStyle.ShapeType.POINT;
  }

  /**
   * @inheritDoc
   */
  applyValue(configs, value) {
    var feature = /** @type {Feature} */ (this.getFeature());
    feature.set(StyleField.SHAPE, value);

    var config = /** @type {Array<Object>|Object|undefined} */ (this.getFeatureConfigs(feature));
    if (Array.isArray(config)) {
      config = config[0];
    }
    if (value == osStyle.ShapeType.NONE) {
      config['geometry'] = FeatureEditCtrl.HIDE_GEOMETRY;
    } else {
      delete config['geometry'];
    }
    super.applyValue(configs, value);
  }
}

exports = FeatureShape;
