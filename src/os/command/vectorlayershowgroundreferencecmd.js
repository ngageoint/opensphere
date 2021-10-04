goog.declareModuleId('os.command.VectorLayerShowGroundReference');

import {Layer as LayerKeys} from '../metrics/metricskeys.js';
import StyleField from '../style/stylefield.js';
import StyleManager from '../style/stylemanager_shim.js';
import AbstractVectorLayerLOB from './abstractvectorlayerlob.js';


/**
 * Changes if ellipse ground reference is shown in 3D mode.
 */
export default class VectorLayerShowGroundReference extends AbstractVectorLayerLOB {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {boolean} value
   * @param {boolean=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.metricKey = LayerKeys.VECTOR_GROUND_REF;

    // make sure the value is a boolean
    this.value = !!value;
    this.title = value ? 'Enable Ground Reference' : 'Disable Ground Reference';
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return config != null && config[StyleField.SHOW_GROUND_REF] || false;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[StyleField.SHOW_GROUND_REF] = value;
    super.applyValue(config, value);
  }
}
