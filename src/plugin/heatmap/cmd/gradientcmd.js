goog.declareModuleId('plugin.heatmap.cmd.Gradient');

import AbstractStyle from '../../../os/command/abstractstylecmd.js';


/**
 * Changes the gradient of a heatmap.
 */
export default class Gradient extends AbstractStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {number} value
   * @param {number=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Change heatmap gradient';
    this.updateOldValue();
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var layer = /** @type {plugin.heatmap.Heatmap} */ (this.getLayer());

    if (layer) {
      return layer.getGradient();
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    var layer = /** @type {plugin.heatmap.Heatmap} */ (this.getLayer());
    if (layer) {
      layer.setGradient(value);
    }
  }

  /**
   * I'm just here so I don't throw an error.
   *
   * @inheritDoc
   */
  getLayerConfig() {
    return {};
  }
}
