goog.declareModuleId('os.command.FeatureShowLabel');

import RecordField from '../../data/recordfield.js';
import {Layer as LayerKeys} from '../../metrics/metricskeys.js';
import {updateShown} from '../../style/label.js';
import AbstractFeatureStyle from './abstractfeaturestylecmd.js';


/**
 * Changes if labels are always shown for a feature, or on highlight only.
 */
export default class FeatureShowLabel extends AbstractFeatureStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} featureId
   * @param {boolean} value
   * @param {boolean=} opt_oldValue
   */
  constructor(layerId, featureId, value, opt_oldValue) {
    super(layerId, featureId, value, opt_oldValue);
    this.metricKey = LayerKeys.FEATURE_LABEL_TOGGLE;
    // make sure the value is a boolean
    this.value = value || false;
    this.title = value ? 'Show Feature Labels' : 'Hide Feature Labels';
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var feature = /** @type {Feature} */ (this.getFeature());
    if (feature == null) {
      return null;
    }

    var showLabels = feature.get(RecordField.FORCE_SHOW_LABEL);
    return showLabels ? showLabels : true;
  }

  /**
   * @inheritDoc
   */
  applyValue(configs, value) {
    var feature = /** @type {Feature} */ (this.getFeature());
    feature.set(RecordField.FORCE_SHOW_LABEL, value);
    super.applyValue(configs, value);
  }

  /**
   * @inheritDoc
   */
  finish(configs) {
    // label overlap will likely change, so update them
    updateShown();
    super.finish(configs);
  }
}
