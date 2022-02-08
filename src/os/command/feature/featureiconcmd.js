goog.declareModuleId('os.command.FeatureIcon');

import {Layer as LayerKeys} from '../../metrics/metricskeys.js';
import * as osStyle from '../../style/style.js';
import * as kml from '../../ui/file/kml/kml.js';
import AbstractFeatureStyle from './abstractfeaturestylecmd.js';


/**
 * Configure a feature to display an icon.
 */
export default class FeatureIcon extends AbstractFeatureStyle {
  /**
   * Constructor.
   * @param {string} layerId The layer id.
   * @param {string} featureId The feature id.
   * @param {osx.icon.Icon} icon The new icon.
   * @param {osx.icon.Icon=} opt_oldIcon The old icon.
   */
  constructor(layerId, featureId, icon, opt_oldIcon) {
    super(layerId, featureId, icon, opt_oldIcon);
    this.title = 'Change Feature Icon';
    this.metricKey = LayerKeys.FEATURE_ICON;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var feature = /** @type {Feature} */ (this.getFeature());
    if (feature == null) {
      return null;
    }

    var configs = /** @type {Array<Object>|Object|undefined} */ (this.getFeatureConfigs(feature));
    if (Array.isArray(configs)) {
      configs = configs.length > 1 ? configs[1] : configs[0];
    }

    return osStyle.getConfigIcon(configs) || kml.getDefaultIcon();
  }

  /**
   * @inheritDoc
   */
  applyValue(configs, value) {
    if (value) {
      var config = configs.length > 1 ? configs[1] : configs[0]; // using 1 is specific to tracks
      osStyle.setConfigIcon(config, value);
    }

    super.applyValue(configs, value);
  }
}
