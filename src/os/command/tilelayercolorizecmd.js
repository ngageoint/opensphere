goog.module('os.command.TileLayerColorize');
goog.module.declareLegacyNamespace();

const AbstractLayerStyle = goog.require('os.command.AbstractLayerStyle');


/**
 * Changes whether a layer is colorized.
 */
class TileLayerColorize extends AbstractLayerStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {boolean} value
   * @param {boolean=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Colorize Layer';
    this.value = value;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var layer = os.MapContainer.getInstance().getLayer(this.layerId);
    return layer instanceof os.layer.Tile ? layer.getColorize() : null;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    var layer = os.MapContainer.getInstance().getLayer(this.layerId);
    if (layer instanceof os.layer.Tile) {
      layer.setColorize(value);
    }

    super.applyValue(config, value);
  }
}

exports = TileLayerColorize;
