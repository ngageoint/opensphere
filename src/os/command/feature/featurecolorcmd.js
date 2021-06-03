goog.module('os.command.FeatureColor');
goog.module.declareLegacyNamespace();

const AbstractFeatureStyle = goog.require('os.command.AbstractFeatureStyle');
const style = goog.require('os.command.style');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const metrics = goog.require('os.metrics');
const osStyle = goog.require('os.style');


/**
 * Changes the color of a feature
 */
class FeatureColor extends AbstractFeatureStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} featureId
   * @param {Array<number>|string} color
   * @param {(Array<number>|string|null)=} opt_oldColor
   * @param {style.ColorChangeType=} opt_changeMode
   */
  constructor(layerId, featureId, color, opt_oldColor, opt_changeMode) {
    /**
     * The color change mode. Determines how the config color is set.
     * @type {style.ColorChangeType}
     * @protected
     */
    this.changeMode = opt_changeMode || style.ColorChangeType.COMBINED;

    // intentionally called after changeMode is set so getOldValue has the correct value
    super(layerId, featureId, color, opt_oldColor);

    switch (this.changeMode) {
      case style.ColorChangeType.FILL:
        this.title = 'Change Feature Fill Color';
        this.metricKey = metrics.Layer.FEATURE_FILL_COLOR;
        this.defaultColor = osStyle.DEFAULT_FILL_COLOR;
        break;
      case style.ColorChangeType.STROKE:
        this.title = 'Change Feature Color';
        this.metricKey = metrics.Layer.FEATURE_COLOR;
        this.defaultColor = osStyle.DEFAULT_LAYER_COLOR;
        break;
      case style.ColorChangeType.COMBINED:
      default:
        this.title = 'Change Feature Color';
        this.metricKey = metrics.Layer.FEATURE_COLOR;
        this.defaultColor = osStyle.DEFAULT_LAYER_COLOR;
        break;
    }

    if (!color) {
      var feature = /** @type {ol.Feature} */ (this.getFeature());
      var config = /** @type {Object|undefined} */ (feature.get(osStyle.StyleType.FEATURE));

      if (config) {
        if (Array.isArray(config)) {
          config = config[0];
        }
        var configColor = /** @type {Array<number>|string|undefined} */ (osStyle.getConfigColor(config));
        if (configColor) {
          color = os.color.toHexString(color);
        }
      }
    }

    // make sure the value is a string
    this.value = osStyle.toRgbaString(color);
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

    var ret = this.defaultColor;

    if (config) {
      switch (this.changeMode) {
        case style.ColorChangeType.FILL:
          ret = osStyle.getConfigColor(config, false, osStyle.StyleField.FILL);
          break;
        case style.ColorChangeType.STROKE:
          ret = osStyle.getConfigColor(config, false, osStyle.StyleField.STROKE);
          break;
        case style.ColorChangeType.COMBINED:
        default:
          ret = osStyle.getConfigColor(config);
          break;
      }
    }

    return ret;
  }

  /**
   * Gets the old label color
   *
   * @return {Array<number>|string}
   */
  getLabelValue() {
    var feature = /** @type {ol.Feature} */ (this.getFeature());
    var labelColor = /** @type {Array<number>|string|undefined} */ (feature.get(osStyle.StyleField.LABEL_COLOR));
    return labelColor ? labelColor : osStyle.DEFAULT_LAYER_COLOR;
  }

  /**
   * @inheritDoc
   */
  applyValue(configs, value) {
    var color = osStyle.toRgbaString(/** @type {string} */ (value));

    // ignore opacity when comparing the label color to the current color
    var labelColor = os.color.toHexString(this.getLabelValue());
    var currentColor = this.state === os.command.State.EXECUTING ? this.oldValue : this.value;
    var currentHexColor = currentColor ? os.color.toHexString(currentColor) : null;

    switch (this.changeMode) {
      case style.ColorChangeType.FILL:
        for (var i = 0; i < configs.length; i++) {
          osStyle.setFillColor(configs[i], color);
        }
        break;
      case style.ColorChangeType.STROKE:
        for (var i = 0; i < configs.length; i++) {
          var fillColor = osStyle.getConfigColor(configs[i], false, osStyle.StyleField.FILL);

          osStyle.setConfigColor(configs[i], color);

          // preserve the original fill color when changing the stroke
          if (fillColor) {
            osStyle.setFillColor(configs[i], osStyle.toRgbaString(fillColor));
          }
        }

        // if the label color matches the style color, change it as well
        if (labelColor == currentHexColor) {
          this.applyLabelValue(configs, color);
        }
        break;
      case style.ColorChangeType.COMBINED:
      default:
        for (var i = 0; i < configs.length; i++) {
          osStyle.setConfigColor(configs[i], color);
        }

        // if the label color matches the style color, change it as well
        if (labelColor == currentHexColor) {
          this.applyLabelValue(configs, color);
        }
        break;
    }

    super.applyValue(configs, value);
  }

  /**
   * Set the label color
   *
   * @param {Object} configs The style config
   * @param {string} value The value to apply
   */
  applyLabelValue(configs, value) {
    var feature = /** @type {ol.Feature} */ (this.getFeature());
    feature.set(osStyle.StyleField.LABEL_COLOR, value);

    for (var i = 0; i < configs.length; i++) {
      configs[i][osStyle.StyleField.LABEL_COLOR] = value;
    }
  }

  /**
   * @inheritDoc
   */
  finish(configs) {
    // dispatch the color change event on the source for the histogram
    var feature = this.getFeature();

    feature.dispatchEvent(new PropertyChangeEvent('colors'));

    super.finish(configs);
  }
}

exports = FeatureColor;
