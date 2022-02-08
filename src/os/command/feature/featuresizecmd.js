goog.declareModuleId('os.command.FeatureSize');

import {Layer as LayerKeys} from '../../metrics/metricskeys.js';
import * as osStyle from '../../style/style.js';
import AbstractFeatureStyle from './abstractfeaturestylecmd.js';


/**
 * Changes the size of a feature
 */
export default class FeatureSize extends AbstractFeatureStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} featureId
   * @param {number} size
   * @param {number=} opt_oldSize
   */
  constructor(layerId, featureId, size, opt_oldSize) {
    super(layerId, featureId, size, opt_oldSize);
    this.title = 'Change Feature Size';
    this.metricKey = LayerKeys.FEATURE_SIZE;
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

    return osStyle.getConfigSize(config);
  }

  /**
   * @inheritDoc
   */
  applyValue(configs, value) {
    var size = /** @type {number} */ (value);
    for (var i = 0; i < configs.length; i++) {
      osStyle.setConfigSize(configs[i], size);
    }

    super.applyValue(configs, value);
  }
}
