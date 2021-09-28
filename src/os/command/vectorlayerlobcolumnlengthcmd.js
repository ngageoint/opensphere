goog.declareModuleId('os.command.VectorLayerLOBColumnLength');

import {Layer as LayerKeys} from '../metrics/metricskeys.js';
import * as osStyle from '../style/style.js';
import StyleField from '../style/stylefield.js';
import StyleManager from '../style/stylemanager_shim.js';
import AbstractVectorLayerLOB from './abstractvectorlayerlob.js';


/**
 * Changes the lob column length
 *
 * @extends {AbstractVectorLayerLOB<number>}
 */
export default class VectorLayerLOBColumnLength extends AbstractVectorLayerLOB {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {number} value
   * @param {number=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Change Line of Bearing column length';
    this.value = value;
    this.metricKey = LayerKeys.VECTOR_LOB_COLUMN_LENGTH;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return config ? config[StyleField.LOB_COLUMN_LENGTH] : osStyle.DEFAULT_LOB_LENGTH;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[StyleField.LOB_COLUMN_LENGTH] = value;
    super.applyValue(config, value);
  }
}
