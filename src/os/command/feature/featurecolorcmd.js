goog.declareModuleId('os.command.FeatureColor');

import * as osColor from '../../color.js';
import PropertyChangeEvent from '../../events/propertychangeevent.js';
import {PropertyChange} from '../../feature/feature.js';
import {Layer as LayerKeys} from '../../metrics/metricskeys.js';
import * as osStyle from '../../style/style.js';
import StyleField from '../../style/stylefield.js';
import StyleType from '../../style/styletype.js';
import ColorChangeType from '../colorchangetype.js';
import State from '../state.js';
import AbstractFeatureStyle from './abstractfeaturestylecmd.js';


/**
 * Changes the color of a feature
 */
export default class FeatureColor extends AbstractFeatureStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} featureId
   * @param {Array<number>|string} color
   * @param {(Array<number>|string|null)=} opt_oldColor
   * @param {ColorChangeType=} opt_changeMode
   */
  constructor(layerId, featureId, color, opt_oldColor, opt_changeMode) {
    super(layerId, featureId, color, opt_oldColor);

    /**
     * The color change mode. Determines how the config color is set.
     * @type {ColorChangeType}
     * @protected
     */
    this.changeMode = opt_changeMode || ColorChangeType.COMBINED;
    this.updateOldValue();

    switch (this.changeMode) {
      case ColorChangeType.FILL:
        this.title = 'Change Feature Fill Color';
        this.metricKey = LayerKeys.FEATURE_FILL_COLOR;
        this.defaultColor = osStyle.DEFAULT_FILL_COLOR;
        break;
      case ColorChangeType.STROKE:
        this.title = 'Change Feature Color';
        this.metricKey = LayerKeys.FEATURE_COLOR;
        this.defaultColor = osStyle.DEFAULT_LAYER_COLOR;
        break;
      case ColorChangeType.COMBINED:
      default:
        this.title = 'Change Feature Color';
        this.metricKey = LayerKeys.FEATURE_COLOR;
        this.defaultColor = osStyle.DEFAULT_LAYER_COLOR;
        break;
    }

    if (!color) {
      var feature = /** @type {Feature} */ (this.getFeature());
      var config = /** @type {Object|undefined} */ (feature.get(StyleType.FEATURE));

      if (config) {
        if (Array.isArray(config)) {
          config = config[0];
        }
        var configColor = /** @type {Array<number>|string|undefined} */ (osStyle.getConfigColor(config));
        if (configColor) {
          color = osColor.toHexString(color);
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
    var feature = /** @type {Feature} */ (this.getFeature());
    if (feature == null) {
      return null;
    }

    var config = /** @type {Array<Object>|Object|undefined} */ (this.getFeatureConfigs(feature));
    if (Array.isArray(config)) {
      config = config[0];
    }

    var ret = this.defaultColor;

    if (config) {
      switch (this.changeMode) {
        case ColorChangeType.FILL:
          ret = osStyle.getConfigColor(config, false, StyleField.FILL);
          break;
        case ColorChangeType.STROKE:
          ret = osStyle.getConfigColor(config, false, StyleField.STROKE);
          break;
        case ColorChangeType.COMBINED:
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
    var feature = /** @type {Feature} */ (this.getFeature());
    var labelColor = /** @type {Array<number>|string|undefined} */ (feature.get(StyleField.LABEL_COLOR));
    return labelColor ? labelColor : osStyle.DEFAULT_LAYER_COLOR;
  }

  /**
   * @inheritDoc
   */
  applyValue(configs, value) {
    var color = osStyle.toRgbaString(/** @type {string} */ (value));

    // ignore opacity when comparing the label color to the current color
    var labelColor = osColor.toHexString(this.getLabelValue());
    var currentColor = this.state === State.EXECUTING ? this.oldValue : this.value;
    var currentHexColor = currentColor ? osColor.toHexString(currentColor) : null;

    switch (this.changeMode) {
      case ColorChangeType.FILL:
        for (var i = 0; i < configs.length; i++) {
          osStyle.setFillColor(configs[i], color);
        }
        break;
      case ColorChangeType.STROKE:
        for (var i = 0; i < configs.length; i++) {
          var fillColor = osStyle.getConfigColor(configs[i], false, StyleField.FILL);

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
      case ColorChangeType.COMBINED:
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
    var feature = /** @type {Feature} */ (this.getFeature());
    feature.set(StyleField.LABEL_COLOR, value);

    for (var i = 0; i < configs.length; i++) {
      configs[i][StyleField.LABEL_COLOR] = value;
    }
  }

  /**
   * @inheritDoc
   */
  finish(configs) {
    // dispatch the color change event on the feature to update the node icon
    var feature = this.getFeature();
    feature.dispatchEvent(new PropertyChangeEvent(PropertyChange.COLOR));

    super.finish(configs);
  }
}
