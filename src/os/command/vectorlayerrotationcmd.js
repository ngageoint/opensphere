goog.declareModuleId('os.command.VectorLayerRotation');

import {Layer as LayerKeys} from '../metrics/metricskeys.js';
import StyleField from '../style/stylefield.js';
import StyleManager from '../style/stylemanager_shim.js';
import AbstractVectorLayerLOB from './abstractvectorlayerlob.js';


/**
 * Changes the icon rotation column
 *
 * @extends {AbstractVectorLayerLOB<string>}
 */
export default class VectorLayerRotation extends AbstractVectorLayerLOB {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} value
   * @param {string=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Change icon rotation column';
    this.value = value || '';
    this.metricKey = LayerKeys.VECTOR_ROTATION_COLUMN;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return config && config[StyleField.ROTATION_COLUMN] || '';
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[StyleField.ROTATION_COLUMN] = value;

    super.applyValue(config, value);
  }
}
