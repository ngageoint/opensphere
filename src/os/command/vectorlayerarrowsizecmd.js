goog.declareModuleId('os.command.VectorLayerArrowSize');

import {Layer as LayerKeys} from '../metrics/metricskeys.js';
import * as osStyle from '../style/style.js';
import StyleField from '../style/stylefield.js';
import StyleManager from '../style/stylemanager_shim.js';
import AbstractVectorLayerLOB from './abstractvectorlayerlob.js';


/**
 * Changes the arrow size for a lob
 *
 * @extends {AbstractVectorLayerLOB<number>}
 */
export default class VectorLayerArrowSize extends AbstractVectorLayerLOB {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {number} value
   * @param {number=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Change Line of Bearing arrow size';
    this.value = value;
    this.metricKey = LayerKeys.VECTOR_ARROW_SIZE;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return config ? config[StyleField.ARROW_SIZE] : osStyle.DEFAULT_ARROW_SIZE;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[StyleField.ARROW_SIZE] = value;
    super.applyValue(config, value);
  }
}
