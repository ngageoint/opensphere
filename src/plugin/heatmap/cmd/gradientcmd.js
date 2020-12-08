goog.module('plugin.heatmap.cmd.Gradient');
goog.module.declareLegacyNamespace();

const AbstractStyle = goog.require('os.command.AbstractStyle');


/**
 * Changes the gradient of a heatmap.
 */
class Gradient extends AbstractStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {number} value
   * @param {number=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Change heatmap gradient';
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

exports = Gradient;
