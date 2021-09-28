goog.declareModuleId('os.command.VectorLayerLabelSize');

import {Layer as LayerKeys} from '../metrics/metricskeys.js';
import * as label from '../style/label.js';
import StyleField from '../style/stylefield.js';
import StyleManager from '../style/stylemanager_shim.js';
import AbstractVectorStyle from './abstractvectorstylecmd.js';


/**
 * Changes the label size for a layer
 *
 * @extends {AbstractVectorStyle<number>}
 */
export default class VectorLayerLabelSize extends AbstractVectorStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {number} value
   * @param {number=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Change Label Size';
    this.metricKey = LayerKeys.LABEL_SIZE;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return config ? config[StyleField.LABEL_SIZE] : undefined;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[StyleField.LABEL_SIZE] = value;

    super.applyValue(config, value);
  }

  /**
   * @inheritDoc
   */
  finish(config) {
    // label overlap will likely change, so update them
    label.updateShown();
    super.finish(config);
  }
}
