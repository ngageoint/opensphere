goog.declareModuleId('os.command.FeatureOpacity');

import * as osColor from '../../color.js';
import {Layer as LayerKeys} from '../../metrics/metricskeys.js';
import * as osStyle from '../../style/style.js';
import StyleField from '../../style/stylefield.js';
import ColorChangeType from '../colorchangetype.js';
import AbstractFeatureStyle from './abstractfeaturestylecmd.js';

const asserts = goog.require('goog.asserts');


/**
 * Changes the opacity of a feature
 */
export default class FeatureOpacity extends AbstractFeatureStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} featureId
   * @param {number} opacity
   * @param {number|null=} opt_oldOpacity
   * @param {ColorChangeType=} opt_changeMode
   */
  constructor(layerId, featureId, opacity, opt_oldOpacity, opt_changeMode) {
    asserts.assert(opacity != null, 'opacity must be defined');

    super(layerId, featureId, opacity, opt_oldOpacity);

    /**
     * The opacity change mode. Determines how the config opacity is set.
     * @type {ColorChangeType}
     * @protected
     */
    this.changeMode = opt_changeMode || ColorChangeType.COMBINED;
    this.updateOldValue();

    switch (this.changeMode) {
      case ColorChangeType.FILL:
        this.title = 'Change Feature Fill Opacity';
        this.metricKey = LayerKeys.FEATURE_FILL_OPACITY;
        break;
      case ColorChangeType.STROKE:
        this.title = 'Change Feature Opacity';
        this.metricKey = LayerKeys.FEATURE_OPACITY;
        break;
      case ColorChangeType.COMBINED:
      default:
        this.title = 'Change Feature Opacity';
        this.metricKey = LayerKeys.FEATURE_OPACITY;
        break;
    }

    if (this.value == null) {
      this.value = osStyle.DEFAULT_FILL_ALPHA;
    }
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var ret;
    var feature = /** @type {Feature} */ (this.getFeature());
    if (feature == null) {
      return null;
    }

    var config = /** @type {Array<Object>|Object|undefined} */ (this.getFeatureConfigs(feature));
    if (Array.isArray(config)) {
      config = config[0];
    }

    if (config) {
      var color;
      switch (this.changeMode) {
        case ColorChangeType.FILL:
          color = osStyle.getConfigColor(config, true, StyleField.FILL);
          ret = color && color.length === 4 ? color[3] : osStyle.DEFAULT_FILL_ALPHA;
          break;
        case ColorChangeType.STROKE:
          color = osStyle.getConfigColor(config, true, StyleField.STROKE);
          ret = color && color.length === 4 ? color[3] : osStyle.DEFAULT_ALPHA;
          break;
        case ColorChangeType.COMBINED:
        default:
          color = osStyle.getConfigColor(config, true);
          ret = color && color.length === 4 ? color[3] : osStyle.DEFAULT_ALPHA;
          break;
      }
    }

    return ret;
  }

  /**
   * @inheritDoc
   */
  applyValue(configs, value) {
    var color;
    var i;

    switch (this.changeMode) {
      case ColorChangeType.FILL:
        for (i = 0; i < configs.length; i++) {
          color = osStyle.getConfigColor(configs[i], true, StyleField.FILL) ||
              osStyle.getConfigColor(configs[i], true);

          if (color) {
            color[3] = value;
            osStyle.setFillColor(configs[i], osStyle.toRgbaString(color));
          }
        }
        break;
      case ColorChangeType.STROKE:
        for (i = 0; i < configs.length; i++) {
          color = osStyle.getConfigColor(configs[i], true, StyleField.STROKE) ||
              osStyle.getConfigColor(configs[i], true);

          if (color) {
            var fillColor = osStyle.getConfigColor(configs[i], false, StyleField.FILL);

            color[3] = value;

            var colorStr = osStyle.toRgbaString(color);
            osStyle.setConfigColor(configs[i], colorStr);

            // preserve the original fill color when changing the stroke
            if (fillColor) {
              osStyle.setFillColor(configs[i], fillColor);
            }
          }
        }
        this.updateLabelOpacity(configs, value);
        break;
      case ColorChangeType.COMBINED:
      default:
        for (i = 0; i < configs.length; i++) {
          color = osStyle.getConfigColor(configs[i], true);

          if (color) {
            color[3] = value;

            var colorStr = osStyle.toRgbaString(color);
            osStyle.setConfigColor(configs[i], colorStr);
          }
        }
        this.updateLabelOpacity(configs, value);
        break;
    }

    super.applyValue(configs, value);
  }

  /**
   * Set the label color
   *
   * @param {Object} configs The style config
   * @param {number} value The opacity value.
   */
  updateLabelOpacity(configs, value) {
    var feature = /** @type {Feature} */ (this.getFeature());
    if (feature) {
      var labelColor = /** @type {Array<number>|string|undefined} */ (feature.get(StyleField.LABEL_COLOR)) ||
          osStyle.DEFAULT_LAYER_COLOR;
      labelColor = osColor.toRgbArray(labelColor);
      labelColor[3] = value;

      var labelColorStr = osStyle.toRgbaString(labelColor);
      feature.set(StyleField.LABEL_COLOR, labelColorStr);

      for (var i = 0; i < configs.length; i++) {
        configs[i][StyleField.LABEL_COLOR] = labelColorStr;
      }
    }
  }
}
