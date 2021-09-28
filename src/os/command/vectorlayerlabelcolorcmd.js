goog.declareModuleId('os.command.VectorLayerLabelColor');

import {Layer as LayerKeys} from '../metrics/metricskeys.js';
import * as osStyle from '../style/style.js';
import StyleField from '../style/stylefield.js';
import StyleManager from '../style/stylemanager_shim.js';
import AbstractVectorStyle from './abstractvectorstylecmd.js';


/**
 * Changes the label color for a layer
 *
 * @extends {AbstractVectorStyle<string>}
 */
export default class VectorLayerLabelColor extends AbstractVectorStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} value
   * @param {string=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Change Label Color';
    this.metricKey = LayerKeys.LABEL_COLOR;
    // make sure the value is an rgba string, not hex
    if (value != '') {
      this.value = osStyle.toRgbaString(value);
    }
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return config && config[StyleField.LABEL_COLOR] || '';
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[StyleField.LABEL_COLOR] = value;

    super.applyValue(config, value);
  }
}
