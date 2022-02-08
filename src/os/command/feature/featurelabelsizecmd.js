goog.declareModuleId('os.command.FeatureLabelSize');

import {Layer as LayerKeys} from '../../metrics/metricskeys.js';
import * as label from '../../style/label.js';
import StyleField from '../../style/stylefield.js';
import AbstractFeatureStyle from './abstractfeaturestylecmd.js';


/**
 * Changes the label size for a feature
 *
 * @extends {AbstractFeatureStyle<number>}
 */
export default class FeatureLabelSize extends AbstractFeatureStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} featureId
   * @param {number} value
   * @param {number=} opt_oldValue
   */
  constructor(layerId, featureId, value, opt_oldValue) {
    super(layerId, featureId, value, opt_oldValue);
    this.title = 'Change Feature Label Size';
    this.metricKey = LayerKeys.FEATURE_LABEL_SIZE;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var feature = /** @type {Feature} */ (this.getFeature());
    if (feature == null) {
      return null;
    }

    var labelSize = feature.get(StyleField.LABEL_SIZE);
    return labelSize ? labelSize : label.DEFAULT_SIZE;
  }

  /**
   * @inheritDoc
   */
  applyValue(configs, value) {
    var feature = /** @type {Feature} */ (this.getFeature());
    feature.set(StyleField.LABEL_SIZE, value);

    for (var i = 0; i < configs.length; i++) {
      configs[i][StyleField.LABEL_SIZE] = value;
    }

    super.applyValue(configs, value);
  }

  /**
   * @inheritDoc
   */
  finish(config) {
    // label overlap will likely change, so update them
    label.updateShown();
    super.finish(config);
  }
}
