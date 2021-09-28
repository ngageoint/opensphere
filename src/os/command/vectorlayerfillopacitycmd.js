goog.declareModuleId('os.command.VectorLayerFillOpacity');

import {Layer as LayerKeys} from '../metrics/metricskeys.js';
import * as osStyle from '../style/style.js';
import StyleField from '../style/stylefield.js';
import StyleManager from '../style/stylemanager_shim.js';
import AbstractVectorStyle from './abstractvectorstylecmd.js';


/**
 * Changes the fill opacity of a vector layer.
 */
export default class VectorLayerFillOpacity extends AbstractVectorStyle {
  /**
   * Constructor.
   * @param {string} layerId The layer id.
   * @param {number} opacity The new fill opacity value.
   * @param {number|null=} opt_oldOpacity The old fill opacity value.
   */
  constructor(layerId, opacity, opt_oldOpacity) {
    super(layerId, opacity, opt_oldOpacity);
    this.title = 'Change Layer Fill Opacity';
    this.metricKey = LayerKeys.VECTOR_FILL_OPACITY;

    if (this.value == null) {
      this.value = osStyle.DEFAULT_FILL_ALPHA;
    }
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    var color = osStyle.getConfigColor(config, true, StyleField.FILL);
    return color && color.length === 4 ? color[3] : osStyle.DEFAULT_FILL_ALPHA;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    var color = osStyle.getConfigColor(config, true, StyleField.FILL) ||
        osStyle.getConfigColor(config, true);

    if (color) {
      color[3] = value;

      var colorString = osStyle.toRgbaString(color);
      osStyle.setFillColor(config, colorString);
    }

    super.applyValue(config, value);
  }
}
