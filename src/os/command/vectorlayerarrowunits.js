goog.declareModuleId('os.command.VectorLayerArrowUnits');

import {Layer as LayerKeys} from '../metrics/metricskeys.js';
import * as osStyle from '../style/style.js';
import StyleField from '../style/stylefield.js';
import StyleManager from '../style/stylemanager_shim.js';
import AbstractVectorLayerLOB from './abstractvectorlayerlob.js';


/**
 * Changes the lob length units
 *
 * @extends {AbstractVectorLayerLOB<string>}
 */
export default class VectorLayerArrowUnits extends AbstractVectorLayerLOB {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} value
   * @param {string=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Change arrow units';
    this.value = value || osStyle.DEFAULT_UNITS;
    this.metricKey = LayerKeys.VECTOR_ARROW_UNITS;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return config && config[StyleField.ARROW_UNITS] || osStyle.DEFAULT_UNITS;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[StyleField.ARROW_UNITS] = value;

    super.applyValue(config, value);
  }
}
