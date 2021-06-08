goog.module('os.command.TileLayerColorize');
goog.module.declareLegacyNamespace();

const AbstractLayerStyle = goog.require('os.command.AbstractLayerStyle');
const instanceOf = goog.require('os.instanceOf');
const LayerClass = goog.require('os.layer.LayerClass');
const {getMapContainer} = goog.require('os.map.instance');

const TileLayer = goog.requireType('os.layer.Tile');


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
    var layer = getMapContainer().getLayer(this.layerId);
    return instanceOf(layer, LayerClass.TILE) ? /** @type {TileLayer} */ (layer).getColorize() : null;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    var layer = getMapContainer().getLayer(this.layerId);
    if (instanceOf(layer, LayerClass.TILE)) {
      /** @type {TileLayer} */ (layer).setColorize(value);
    }

    super.applyValue(config, value);
  }
}

exports = TileLayerColorize;
