goog.declareModuleId('os.command.FeatureCenterShape');

import {SUB_DELIMITER} from '../../metrics/index.js';
import {Layer as LayerKeys} from '../../metrics/metricskeys.js';
import * as osStyle from '../../style/style.js';
import StyleField from '../../style/stylefield.js';
import AbstractFeatureStyle from './abstractfeaturestylecmd.js';


/**
 * Changes the center style of a feature
 */
export default class FeatureCenterShape extends AbstractFeatureStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} featureId
   * @param {string} value
   * @param {string=} opt_oldValue
   */
  constructor(layerId, featureId, value, opt_oldValue) {
    super(layerId, featureId, value, opt_oldValue);
    this.title = 'Change Feature Center Style';

    var type = value ? value.replace(/ /g, '_') : 'Unknown';
    this.metricKey = LayerKeys.FEATURE_CENTER_SHAPE + SUB_DELIMITER + type;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var feature = /** @type {Feature} */ (this.getFeature());
    if (feature == null) {
      return null;
    }

    var shape = feature.get(StyleField.CENTER_SHAPE);
    return shape ? shape : osStyle.ShapeType.POINT;
  }

  /**
   * @inheritDoc
   */
  applyValue(configs, value) {
    var feature = /** @type {Feature} */ (this.getFeature());
    feature.set(StyleField.CENTER_SHAPE, value);
    super.applyValue(configs, value);
  }
}
