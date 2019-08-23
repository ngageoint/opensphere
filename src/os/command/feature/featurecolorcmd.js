goog.provide('os.command.FeatureColor');

goog.require('os.command.AbstractFeatureStyle');
goog.require('os.command.style');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.metrics');
goog.require('os.style');



/**
 * Changes the color of a feature
 *
 * @extends {os.command.AbstractFeatureStyle}
 * @param {string} layerId
 * @param {string} featureId
 * @param {Array<number>|string} color
 * @param {(Array<number>|string|null)=} opt_oldColor
 * @param {os.command.style.ColorChangeType=} opt_changeMode
 * @constructor
 */
os.command.FeatureColor = function(layerId, featureId, color, opt_oldColor, opt_changeMode) {
  /**
   * The color change mode. Determines how the config color is set.
   * @type {os.command.style.ColorChangeType}
   * @protected
   */
  this.changeMode = opt_changeMode || os.command.style.ColorChangeType.COMBINED;

  // intentionally called after changeMode is set so getOldValue has the correct value
  os.command.FeatureColor.base(this, 'constructor', layerId, featureId, color, opt_oldColor);

  switch (this.changeMode) {
    case os.command.style.ColorChangeType.FILL:
      this.title = 'Change Feature Fill Color';
      this.metricKey = os.metrics.Layer.FEATURE_FILL_COLOR;
      this.defaultColor = os.style.DEFAULT_FILL_COLOR;
      break;
    case os.command.style.ColorChangeType.STROKE:
      this.title = 'Change Feature Color';
      this.metricKey = os.metrics.Layer.FEATURE_COLOR;
      this.defaultColor = os.style.DEFAULT_LAYER_COLOR;
      break;
    case os.command.style.ColorChangeType.COMBINED:
    default:
      this.title = 'Change Feature Color';
      this.metricKey = os.metrics.Layer.FEATURE_COLOR;
      this.defaultColor = os.style.DEFAULT_LAYER_COLOR;
      break;
  }

  if (!color) {
    var feature = /** @type {ol.Feature} */ (this.getFeature());
    var config = /** @type {Object|undefined} */ (feature.get(os.style.StyleType.FEATURE));

    if (config) {
      if (Array.isArray(config)) {
        config = config[0];
      }
      var configColor = /** @type {Array<number>|string|undefined} */ (os.style.getConfigColor(config));
      if (configColor) {
        color = os.color.toHexString(color);
      }
    }
  }

  // make sure the value is a string
  this.value = os.style.toRgbaString(color);
};
goog.inherits(os.command.FeatureColor, os.command.AbstractFeatureStyle);


/**
 * @inheritDoc
 */
os.command.FeatureColor.prototype.getOldValue = function() {
  var feature = /** @type {ol.Feature} */ (this.getFeature());
  var config = /** @type {Array<Object>|Object|undefined} */ (this.getFeatureConfigs(feature));
  if (Array.isArray(config)) {
    config = config[0];
  }

  var ret = this.defaultColor;

  if (config) {
    switch (this.changeMode) {
      case os.command.style.ColorChangeType.FILL:
        ret = os.style.getConfigColor(config, false, os.style.StyleField.FILL);
        break;
      case os.command.style.ColorChangeType.STROKE:
        ret = os.style.getConfigColor(config, false, os.style.StyleField.STROKE);
        break;
      case os.command.style.ColorChangeType.COMBINED:
      default:
        ret = os.style.getConfigColor(config);
        break;
    }
  }

  return ret;
};


/**
 * Gets the old label color
 *
 * @return {Array<number>|string}
 */
os.command.FeatureColor.prototype.getLabelValue = function() {
  var feature = /** @type {ol.Feature} */ (this.getFeature());
  var labelColor = /** @type {Array<number>|string|undefined} */ (feature.get(os.style.StyleField.LABEL_COLOR));
  return labelColor ? labelColor : os.style.DEFAULT_LAYER_COLOR;
};


/**
 * @inheritDoc
 */
os.command.FeatureColor.prototype.applyValue = function(configs, value) {
  var color = os.style.toRgbaString(/** @type {string} */ (value));

  // ignore opacity when comparing the label color to the current color
  var labelColor = os.color.toHexString(this.getLabelValue());
  var currentColor = this.state === os.command.State.EXECUTING ? this.oldValue : this.value;
  var currentHexColor = currentColor ? os.color.toHexString(currentColor) : null;

  switch (this.changeMode) {
    case os.command.style.ColorChangeType.FILL:
      for (var i = 0; i < configs.length; i++) {
        os.style.setFillColor(configs[i], color);
      }
      break;
    case os.command.style.ColorChangeType.STROKE:
      for (var i = 0; i < configs.length; i++) {
        var fillColor = os.style.getConfigColor(configs[i], false, os.style.StyleField.FILL);

        os.style.setConfigColor(configs[i], color);

        // preserve the original fill color when changing the stroke
        if (fillColor) {
          os.style.setFillColor(configs[i], os.style.toRgbaString(fillColor));
        }
      }

      // if the label color matches the style color, change it as well
      if (labelColor == currentHexColor) {
        this.applyLabelValue(configs, color);
      }
      break;
    case os.command.style.ColorChangeType.COMBINED:
    default:
      for (var i = 0; i < configs.length; i++) {
        os.style.setConfigColor(configs[i], color);
      }

      // if the label color matches the style color, change it as well
      if (labelColor == currentHexColor) {
        this.applyLabelValue(configs, color);
      }
      break;
  }

  os.command.FeatureColor.base(this, 'applyValue', configs, value);
};


/**
 * Set the label color
 *
 * @param {Object} configs The style config
 * @param {string} value The value to apply
 */
os.command.FeatureColor.prototype.applyLabelValue = function(configs, value) {
  var feature = /** @type {ol.Feature} */ (this.getFeature());
  feature.set(os.style.StyleField.LABEL_COLOR, value);

  for (var i = 0; i < configs.length; i++) {
    configs[i][os.style.StyleField.LABEL_COLOR] = value;
  }
};


/**
 * @inheritDoc
 */
os.command.FeatureColor.prototype.finish = function(configs) {
  // dispatch the color change event on the source for the histogram
  var feature = this.getFeature();

  feature.dispatchEvent(new os.events.PropertyChangeEvent('colors'));

  os.command.FeatureColor.base(this, 'finish', configs);
};
