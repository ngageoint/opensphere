goog.provide('os.command.FeatureOpacity');

goog.require('os.command.AbstractFeatureStyle');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.metrics');
goog.require('os.ui');



/**
 * Changes the opacity of a feature
 *
 * @extends {os.command.AbstractFeatureStyle}
 * @param {string} layerId
 * @param {string} featureId
 * @param {number} opacity
 * @param {number|null=} opt_oldOpacity
 * @param {string=} opt_changeMode
 * @constructor
 */
os.command.FeatureOpacity = function(layerId, featureId, opacity, opt_oldOpacity, opt_changeMode) {
  this.changeMode = opt_changeMode;
  os.command.FeatureOpacity.base(this, 'constructor', layerId, featureId, opacity, opt_oldOpacity);

  switch (this.changeMode) {
    case os.command.FeatureOpacity.MODE.FILL:
      this.title = 'Change Feature Fill Opacity';
      this.metricKey = os.metrics.Layer.FEATURE_FILL_OPACITY;
      this.defaultOpacity = os.command.FeatureOpacity.DEFAULT_FILL_OPACITY;
      break;
    case os.command.FeatureOpacity.MODE.STROKE:
      this.title = 'Change Feature Stroke Opacity';
      this.metricKey = os.metrics.Layer.FEATURE_STROKE_OPACITY;
      this.defaultOpacity = os.command.FeatureOpacity.DEFAULT_OPACITY;
      break;
    default:
    case os.command.FeatureOpacity.MODE.COMBINED:
      this.title = 'Change Feature Opacity';
      this.metricKey = os.metrics.Layer.FEATURE_OPACITY;
      this.defaultOpacity = os.command.FeatureOpacity.DEFAULT_OPACITY;
      break;
  }

  if (!opacity) {
    var feature = this.getFeature();
    var config = /** @type {Object|undefined} */ (feature.get(os.style.StyleType.FEATURE));

    if (config) {
      if (goog.isArray(config)) {
        config = config[0];
      }
      opacity = /** @type {number} */ (os.style.getConfigOpacityColor(config));
    }
  }

  this.value = opacity;
};
goog.inherits(os.command.FeatureOpacity, os.command.AbstractFeatureStyle);


/**
 * @type {number}
 * @const
 */
os.command.FeatureOpacity.DEFAULT_OPACITY = 1;


/**
 * @type {number}
 * @const
 */
os.command.FeatureOpacity.DEFAULT_FILL_OPACITY = 0;


os.command.FeatureOpacity.MODE = {
  COMBINED: 'combined',
  FILL: 'fill',
  STROKE: 'stroke'
};


/**
 * @inheritDoc
 */
os.command.FeatureOpacity.prototype.getOldValue = function() {
  var feature = /** @type {ol.Feature} */ (this.getFeature());
  var config = /** @type {Array<Object>|Object|undefined} */ (this.getFeatureConfigs(feature));
  if (goog.isArray(config)) {
    config = config[0];
  }

  var ret = this.defaultOpacity;

  if (config) {
    switch (this.changeMode) {
      case os.command.FeatureOpacity.MODE.FILL:
        var color = os.style.getConfigColor(config, true, os.style.StyleField.FILL);
        ret = color[3];
        break;
      case os.command.FeatureOpacity.MODE.STROKE:
        var color = os.style.getConfigColor(config, true, os.style.StyleField.STROKE);
        ret = color[3];
        break;
      default:
      case os.command.FeatureOpacity.MODE.COMBINED:
        var color = os.style.getConfigColor(config, true);
        ret = color[3];
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
    case os.command.FeatureOpacity.MODE.FILL:
      for (i = 0; i < configs.length; i++) {
        color = os.style.getConfigColor(configs[i], true, os.style.StyleField.FILL);
        color[3] = value;
        colorValue = os.style.toRgbaString(color);
        os.style.setConfigColor(configs[i], colorValue, [os.style.StyleField.FILL]);
      }
      break;
    case os.command.FeatureOpacity.MODE.STROKE:
      for (i = 0; i < configs.length; i++) {
        color = os.style.getConfigColor(configs[i], true, os.style.StyleField.STROKE);
        color[3] = value;
        colorValue = os.style.toRgbaString(color);
        os.style.setConfigColor(configs[i], colorValue, [os.style.StyleField.STROKE, os.style.StyleField.IMAGE]);
      }
      break;
    default:
    case os.command.FeatureOpacity.MODE.COMBINED:
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
