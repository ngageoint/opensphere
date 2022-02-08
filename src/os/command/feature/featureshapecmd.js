goog.declareModuleId('os.command.FeatureShape');

import {SUB_DELIMITER} from '../../metrics/index.js';
import {Layer as LayerKeys} from '../../metrics/metricskeys.js';
import * as osStyle from '../../style/style.js';
import StyleField from '../../style/stylefield.js';
import {Controller as FeatureEditCtrl} from '../../ui/featureedit.js';
import AbstractFeatureStyle from './abstractfeaturestylecmd.js';


/**
 * Changes the style of a feature
 */
export default class FeatureShape extends AbstractFeatureStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} featureId
   * @param {string} value
   * @param {string=} opt_oldValue
   */
  constructor(layerId, featureId, value, opt_oldValue) {
    super(layerId, featureId, value, opt_oldValue);
    this.title = 'Change Feature Style';

    var type = value ? value.replace(/ /g, '_') : 'Unknown';
    this.metricKey = LayerKeys.FEATURE_SHAPE + SUB_DELIMITER + type;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var feature = /** @type {Feature} */ (this.getFeature());
    if (feature == null) {
      return null;
    }

    var shape = feature.get(StyleField.SHAPE);
    return shape ? shape : osStyle.ShapeType.POINT;
  }

  /**
   * @inheritDoc
   */
  applyValue(configs, value) {
    var feature = /** @type {Feature} */ (this.getFeature());
    feature.set(StyleField.SHAPE, value);

    var config = /** @type {Array<Object>|Object|undefined} */ (this.getFeatureConfigs(feature));
    if (Array.isArray(config)) {
      config = config[0];
    }
    if (value == osStyle.ShapeType.NONE) {
      config['geometry'] = FeatureEditCtrl.HIDE_GEOMETRY;
    } else {
      delete config['geometry'];
    }
    super.applyValue(configs, value);
  }
}
