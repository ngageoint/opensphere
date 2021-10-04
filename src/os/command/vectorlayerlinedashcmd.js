goog.declareModuleId('os.command.VectorLayerLineDash');

import {Layer as LayerKeys} from '../metrics/metricskeys.js';
import * as osStyle from '../style/style.js';
import StyleManager from '../style/stylemanager_shim.js';
import AbstractVectorStyle from './abstractvectorstylecmd.js';


/**
 * Changes the line dash of a layer
 */
export default class VectorLayerLineDash extends AbstractVectorStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {Array<number>} lineDash
   * @param {Array<number>=} opt_oldLineDash
   */
  constructor(layerId, lineDash, opt_oldLineDash) {
    super(layerId, lineDash, opt_oldLineDash);
    this.title = 'Change LineDash';
    this.metricKey = LayerKeys.VECTOR_LINE_DASH;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return osStyle.getConfigLineDash(config);
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    var lineDash = /** @type {Array<number>} */ (value);
    osStyle.setConfigLineDash(config, lineDash);

    super.applyValue(config, value);
  }
}
