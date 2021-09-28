goog.declareModuleId('os.command.VectorLayerBearing');

import {Layer as LayerKeys} from '../metrics/metricskeys.js';
import StyleField from '../style/stylefield.js';
import StyleManager from '../style/stylemanager_shim.js';
import AbstractVectorLayerLOB from './abstractvectorlayerlob.js';


/**
 * Changes the lob bearing column
 *
 * @extends {AbstractVectorLayerLOB<string>}
 */
export default class VectorLayerBearing extends AbstractVectorLayerLOB {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} value
   * @param {string=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Change bearing column';
    this.value = value || '';
    this.metricKey = LayerKeys.VECTOR_LOB_BEARING_COLUMN;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return config && config[StyleField.LOB_BEARING_COLUMN] || '';
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[StyleField.LOB_BEARING_COLUMN] = value;

    super.applyValue(config, value);
  }
}
