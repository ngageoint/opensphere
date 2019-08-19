goog.provide('os.command.FeatureOpacity');

goog.require('goog.asserts');
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
  goog.asserts.assert(opacity != null, 'opacity must be defined');

  /**
   * The opacity change mode. Determines how the config opacity is set.
   * @type {os.command.style.ColorChangeType}
   * @protected
   */
  this.changeMode = opt_changeMode || os.command.style.ColorChangeType.COMBINED;

  // intentionally called after changeMode is set so getOldValue has the correct value
  os.command.FeatureOpacity.base(this, 'constructor', layerId, featureId, opacity, opt_oldOpacity);

  switch (this.changeMode) {
    case os.command.style.ColorChangeType.FILL:
      this.title = 'Change Feature Fill Opacity';
      this.metricKey = os.metrics.Layer.FEATURE_FILL_OPACITY;
      break;
    case os.command.style.ColorChangeType.STROKE:
      this.title = 'Change Feature Opacity';
      this.metricKey = os.metrics.Layer.FEATURE_OPACITY;
      break;
    case os.command.style.ColorChangeType.COMBINED:
    default:
      this.title = 'Change Feature Opacity';
      this.metricKey = os.metrics.Layer.FEATURE_OPACITY;
      break;
  }
};
goog.inherits(os.command.FeatureOpacity, os.command.AbstractFeatureStyle);


/**
 * @inheritDoc
 */
os.command.FeatureOpacity.prototype.getOldValue = function() {
  var ret;
  var feature = /** @type {ol.Feature} */ (this.getFeature());
  var config = /** @type {Array<Object>|Object|undefined} */ (this.getFeatureConfigs(feature));
  if (Array.isArray(config)) {
    config = config[0];
  }

  if (config) {
    var color;
    switch (this.changeMode) {
      case os.command.style.ColorChangeType.FILL:
        color = os.style.getConfigColor(config, true, os.style.StyleField.FILL);
        ret = color && color.length === 4 ? color[3] : os.style.DEFAULT_FILL_ALPHA;
        break;
      case os.command.style.ColorChangeType.STROKE:
        color = os.style.getConfigColor(config, true, os.style.StyleField.STROKE);
        ret = color && color.length === 4 ? color[3] : os.style.DEFAULT_ALPHA;
        break;
      case os.command.style.ColorChangeType.COMBINED:
      default:
        color = os.style.getConfigColor(config, true);
        ret = color && color.length === 4 ? color[3] : os.style.DEFAULT_ALPHA;
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
        color = os.style.getConfigColor(configs[i], true, os.style.StyleField.FILL) ||
            os.style.getConfigColor(configs[i], true);

        if (color) {
          color[3] = value;
          colorValue = os.style.toRgbaString(color);
          os.style.setFillColor(configs[i], colorValue);
        }
      }
      break;
    case os.command.style.ColorChangeType.STROKE:
      for (i = 0; i < configs.length; i++) {
        color = os.style.getConfigColor(configs[i], true, os.style.StyleField.STROKE) ||
            os.style.getConfigColor(configs[i], true);

        if (color) {
          var fillColor = os.style.getConfigColor(configs[i], true, os.style.StyleField.FILL);

          color[3] = value;
          colorValue = os.style.toRgbaString(color);
          os.style.setConfigColor(configs[i], colorValue);

          // preserve the original fill color when changing the stroke
          if (fillColor) {
            os.style.setFillColor(configs[i], fillColor);
          }
        }
      }
      break;
    case os.command.style.ColorChangeType.COMBINED:
    default:
      for (i = 0; i < configs.length; i++) {
        color = os.style.getConfigColor(configs[i], true);

        if (color) {
          color[3] = value;
          colorValue = os.style.toRgbaString(color);
          os.style.setConfigColor(configs[i], colorValue);
        }
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
