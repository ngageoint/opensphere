goog.declareModuleId('os.command.VectorLayerSize');

import {Layer as LayerKeys} from '../metrics/metricskeys.js';
import * as osStyle from '../style/style.js';
import StyleManager from '../style/stylemanager_shim.js';
import AbstractVectorStyle from './abstractvectorstylecmd.js';


/**
 * Changes the size of a layer
 */
export default class VectorLayerSize extends AbstractVectorStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {number} size
   * @param {number=} opt_oldSize
   */
  constructor(layerId, size, opt_oldSize) {
    super(layerId, size, opt_oldSize);
    this.title = 'Change Size';
    this.metricKey = LayerKeys.VECTOR_SIZE;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return osStyle.getConfigSize(config);
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    var size = /** @type {number} */ (value);
    osStyle.setConfigSize(config, size);

    super.applyValue(config, value);
  }
}
