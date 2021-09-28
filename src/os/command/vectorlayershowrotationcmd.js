goog.declareModuleId('os.command.VectorLayerShowRotation');

import {Layer as LayerKeys} from '../metrics/metricskeys.js';
import StyleField from '../style/stylefield.js';
import StyleManager from '../style/stylemanager_shim.js';
import AbstractVectorLayerLOB from './abstractvectorlayerlob.js';


/**
 * Changes if icon rotation is shown.
 *
 * @extends {AbstractVectorLayerLOB<boolean>}
 */
export default class VectorLayerShowRotation extends AbstractVectorLayerLOB {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {boolean} value
   * @param {boolean=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.metricKey = LayerKeys.VECTOR_SHOW_ROTATION;

    // make sure the value is a boolean
    this.value = !!value;
    this.title = value ? 'Enable Icon Rotation' : 'Disable Icon Rotation';
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return config != null && config[StyleField.SHOW_ROTATION] || false;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[StyleField.SHOW_ROTATION] = value;
    super.applyValue(config, value);
  }
}
