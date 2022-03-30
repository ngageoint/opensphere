goog.declareModuleId('os.command.FeatureLabel');

import * as olArray from 'ol/src/array.js';

import {Layer as LayerKeys} from '../../metrics/metricskeys.js';
import * as label from '../../style/label.js';
import * as osStyle from '../../style/style.js';
import StyleField from '../../style/stylefield.js';
import AbstractFeatureStyle from './abstractfeaturestylecmd.js';


/**
 * Changes the label field for a feature
 *
 * @extends {AbstractFeatureStyle<string>}
 */
export default class FeatureLabel extends AbstractFeatureStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} featureId
   * @param {Array<label.LabelConfig>} value
   * @param {Array<label.LabelConfig>=} opt_oldValue
   */
  constructor(layerId, featureId, value, opt_oldValue) {
    super(layerId, featureId, value, opt_oldValue);
    this.title = 'Change Feature Label';
    this.metricKey = LayerKeys.FEATURE_LABEL_COLUMN_SELECT;

    /**
     * @type {Array<label.LabelConfig>}
     */
    this.value = value || [label.cloneConfig()];
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
    var labelColumns = [];
    if (config) {
      if (Array.isArray(config)) {
        // locate the label config in the array
        var labelsConfig = olArray.find(config, osStyle.isLabelConfig);
        if (labelsConfig) {
          labelColumns = labelsConfig[StyleField.LABELS];
        }
      } else if (config[StyleField.LABELS]) {
        labelColumns = config[StyleField.LABELS];
      }
    }
    return labelColumns;
  }

  /**
   * @inheritDoc
   */
  applyValue(configs, value) {
    for (var i = 0; i < configs.length; i++) {
      configs[i][StyleField.LABELS] = value;
    }

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
