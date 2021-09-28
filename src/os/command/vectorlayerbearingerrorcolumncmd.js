goog.declareModuleId('os.command.VectorLayerBearingErrorColumn');

import {Layer as LayerKeys} from '../metrics/metricskeys.js';
import StyleField from '../style/stylefield.js';
import StyleManager from '../style/stylemanager_shim.js';
import AbstractVectorLayerLOB from './abstractvectorlayerlob.js';


/**
 * Changes the lob bearing error column
 *
 * @extends {AbstractVectorLayerLOB<string>}
 */
export default class VectorLayerBearingErrorColumn extends AbstractVectorLayerLOB {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} value
   * @param {string=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Change bearing error column';
    this.value = value || '';
    this.metricKey = LayerKeys.VECTOR_LOB_BEARING_ERROR_COLUMN;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return config && config[StyleField.LOB_BEARING_ERROR_COLUMN] || '';
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[StyleField.LOB_BEARING_ERROR_COLUMN] = value;

    super.applyValue(config, value);
  }
}
