goog.provide('os.command.FeatureOpacity');

goog.require('os.command.AbstractFeatureStyle');
goog.require('os.command.style');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.metrics');
goog.require('os.style');



/**
 * Changes the opacity of a feature
 *
 * @extends {os.command.AbstractFeatureStyle}
 * @param {string} layerId
 * @param {string} featureId
 * @param {number} opacity
 * @param {number|null=} opt_oldOpacity
 * @param {os.command.style.ColorChangeType=} opt_changeMode
 * @constructor
 */
os.command.FeatureOpacity = function(layerId, featureId, opacity, opt_oldOpacity, opt_changeMode) {
  /**
   * The opacity change mode. Determines how the config opacity is set.
   * @type {os.command.style.ColorChangeType}
   * @protected
   */
  this.changeMode = opt_changeMode || os.command.style.ColorChangeType.COMBINED;

  os.command.FeatureOpacity.base(this, 'constructor', layerId, featureId, opacity, opt_oldOpacity);

  switch (this.changeMode) {
    case os.command.style.ColorChangeType.FILL:
      this.title = 'Change Feature Fill Opacity';
      this.metricKey = os.metrics.Layer.FEATURE_FILL_OPACITY;
      this.defaultOpacity = os.style.DEFAULT_FILL_ALPHA;
      break;
    case os.command.style.ColorChangeType.STROKE:
      this.title = 'Change Feature Opacity';
      this.metricKey = os.metrics.Layer.FEATURE_OPACITY;
      this.defaultOpacity = os.style.DEFAULT_ALPHA;
      break;
    case os.command.style.ColorChangeType.COMBINED:
    default:
      this.title = 'Change Feature Opacity';
      this.metricKey = os.metrics.Layer.FEATURE_OPACITY;
      this.defaultOpacity = os.style.DEFAULT_ALPHA;
      break;
  }

  if (!opacity) {
    var feature = this.getFeature();
    var config = /** @type {Object|undefined} */ (feature.get(os.style.StyleType.FEATURE));

    if (config) {
      if (Array.isArray(config)) {
        config = config[0];
      }
      opacity = /** @type {number} */ (os.style.getConfigOpacityColor(config));
    }
  }

  this.value = opacity;
};
goog.inherits(os.command.FeatureOpacity, os.command.AbstractFeatureStyle);


/**
 * @inheritDoc
 */
os.command.FeatureOpacity.prototype.getOldValue = function() {
  var feature = /** @type {ol.Feature} */ (this.getFeature());
  var config = /** @type {Array<Object>|Object|undefined} */ (this.getFeatureConfigs(feature));
  if (Array.isArray(config)) {
    config = config[0];
  }

  var ret = this.defaultOpacity;

  if (config) {
    var color;
    switch (this.changeMode) {
      case os.command.style.ColorChangeType.FILL:
        color = os.style.getConfigColor(config, true, os.style.StyleField.FILL);
        if (color && color.length === 4) {
          ret = color[3];
        }
        break;
      case os.command.style.ColorChangeType.STROKE:
        color = os.style.getConfigColor(config, true, os.style.StyleField.STROKE);
        if (color && color.length === 4) {
          ret = color[3];
        }
        break;
      case os.command.style.ColorChangeType.COMBINED:
      default:
        color = os.style.getConfigColor(config, true);
        if (color && color.length === 4) {
          ret = color[3];
        }
        break;
    }
  }

  return ret;
};


/**
 * @inheritDoc
 */
os.command.FeatureOpacity.prototype.applyValue = function(configs, value) {
  var color;
  var colorValue;
  var i;

  switch (this.changeMode) {
    case os.command.style.ColorChangeType.FILL:
      for (i = 0; i < configs.length; i++) {
        color = os.style.getConfigColor(configs[i], true, os.style.StyleField.FILL);
        color[3] = value;
        colorValue = os.style.toRgbaString(color);
        os.style.setConfigColor(configs[i], colorValue, [os.style.StyleField.FILL]);
      }
      break;
    case os.command.style.ColorChangeType.STROKE:
      for (i = 0; i < configs.length; i++) {
        color = os.style.getConfigColor(configs[i], true, os.style.StyleField.STROKE);
        color[3] = value;
        colorValue = os.style.toRgbaString(color);
        var fillColor = os.style.getConfigColor(configs[i], true, os.style.StyleField.FILL);

        os.style.setConfigColor(configs[i], colorValue);

        if (fillColor) {
          os.style.setFillColor(configs[i], fillColor);
        }
      }
      break;
    case os.command.style.ColorChangeType.COMBINED:
    default:
      for (i = 0; i < configs.length; i++) {
        color = os.style.getConfigColor(configs[i], true);
        color[3] = value;
        colorValue = os.style.toRgbaString(color);
        os.style.setConfigColor(configs[i], colorValue);
      }
      break;
  }

  os.command.FeatureOpacity.base(this, 'applyValue', configs, value);
};


/**
 * @inheritDoc
 */
os.command.FeatureOpacity.prototype.finish = function(configs) {
  // dispatch the color change event on the source for the histogram
  var feature = this.getFeature();

  feature.dispatchEvent(new os.events.PropertyChangeEvent('colors'));

  os.command.FeatureOpacity.base(this, 'finish', configs);
};
