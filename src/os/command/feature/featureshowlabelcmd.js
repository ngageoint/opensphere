goog.module('os.command.FeatureShowLabel');

const AbstractFeatureStyle = goog.require('os.command.AbstractFeatureStyle');
const {Layer: LayerKeys} = goog.require('os.metrics.keys');
const StyleField = goog.require('os.style.StyleField');
const label = goog.require('os.style.label');

const Feature = goog.requireType('ol.Feature');


/**
 * Changes if labels are always shown for a feature, or on highlight only.
 */
class FeatureShowLabel extends AbstractFeatureStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} featureId
   * @param {boolean} value
   * @param {boolean=} opt_oldValue
   */
  constructor(layerId, featureId, value, opt_oldValue) {
    super(layerId, featureId, value, opt_oldValue);
    this.metricKey = LayerKeys.FEATURE_LABEL_TOGGLE;
    // make sure the value is a boolean
    this.value = value || false;
    this.title = value ? 'Show Feature Labels' : 'Hide Feature Labels';
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var feature = /** @type {Feature} */ (this.getFeature());
    if (feature == null) {
      return null;
    }

    var showLabels = feature.get(StyleField.SHOW_LABELS);
    return showLabels ? showLabels : true;
  }

  /**
   * @inheritDoc
   */
  applyValue(configs, value) {
    var feature = /** @type {Feature} */ (this.getFeature());
    feature.set(StyleField.SHOW_LABELS, value);
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

exports = FeatureShowLabel;
