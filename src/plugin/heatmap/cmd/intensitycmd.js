goog.module('plugin.heatmap.cmd.Intensity');
goog.module.declareLegacyNamespace();

const AbstractStyle = goog.require('os.command.AbstractStyle');


/**
 * Changes the intensity of a heatmap.
 */
class Intensity extends AbstractStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {number} value
   * @param {number=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Change heatmap intensity';
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var layer = /** @type {plugin.heatmap.Heatmap} */ (this.getLayer());

    if (layer) {
      return layer.getIntensity();
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    var layer = /** @type {plugin.heatmap.Heatmap} */ (this.getLayer());
    if (layer) {
      layer.setIntensity(value);
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

exports = Intensity;
