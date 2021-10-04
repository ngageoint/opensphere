goog.declareModuleId('os.command.VectorLayerShowArrow');

import {Layer as LayerKeys} from '../metrics/metricskeys.js';
import StyleField from '../style/stylefield.js';
import StyleManager from '../style/stylemanager_shim.js';
import AbstractVectorLayerLOB from './abstractvectorlayerlob.js';


/**
 * Changes if lob arrows are shown.
 *
 * @extends {AbstractVectorLayerLOB<boolean>}
 */
export default class VectorLayerShowArrow extends AbstractVectorLayerLOB {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {boolean} value
   * @param {boolean=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.metricKey = LayerKeys.VECTOR_SHOW_ARROW;

    // make sure the value is a boolean
    this.value = !!value;
    this.title = value ? 'Enable Arrow' : 'Disable Arrow';
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return config != null && config[StyleField.SHOW_ARROW] || false;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[StyleField.SHOW_ARROW] = value;
    super.applyValue(config, value);
  }
}
