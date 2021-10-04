goog.declareModuleId('os.command.VectorLayerLOBType');

import {Layer as LayerKeys} from '../metrics/metricskeys.js';
import * as osStyle from '../style/style.js';
import StyleField from '../style/stylefield.js';
import StyleManager from '../style/stylemanager_shim.js';
import AbstractVectorLayerLOB from './abstractvectorlayerlob.js';


/**
 * Changes the lob length type
 *
 * @extends {AbstractVectorLayerLOB<string>}
 */
export default class VectorLayerLOBType extends AbstractVectorLayerLOB {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} value
   * @param {string=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Change Line of Bearing length type (manual or column)';
    this.value = value || osStyle.DEFAULT_LOB_LENGTH_TYPE;
    this.metricKey = LayerKeys.VECTOR_LOB_LENGTH_TYPE;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return config && config[StyleField.LOB_LENGTH_TYPE] || osStyle.DEFAULT_LOB_LENGTH_TYPE;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[StyleField.LOB_LENGTH_TYPE] = value;
    super.applyValue(config, value);
  }
}
