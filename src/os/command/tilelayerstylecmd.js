goog.module('os.command.TileLayerStyle');
goog.module.declareLegacyNamespace();

const AbstractLayerStyle = goog.require('os.command.AbstractLayerStyle');
const instanceOf = goog.require('os.instanceOf');
const LayerClass = goog.require('os.layer.LayerClass');
const {getMapContainer} = goog.require('os.map.instance');

const Tile = goog.requireType('os.layer.Tile');


/**
 * Changes the style of a tile layer
 */
class TileLayerStyle extends AbstractLayerStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {?(string|osx.ogc.TileStyle)} style
   * @param {(?(string|osx.ogc.TileStyle))=} opt_oldStyle
   */
  constructor(layerId, style, opt_oldStyle) {
    super(layerId, style, opt_oldStyle);
    this.title = 'Change Layer Style';
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var layer = getMapContainer().getLayer(this.layerId);
    return instanceOf(layer, LayerClass.TILE) ? /** @type {Tile} */ (layer).getStyle() : null;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    var layer = getMapContainer().getLayer(this.layerId);
    if (instanceOf(layer, LayerClass.TILE)) {
      /** @type {Tile} */ (layer).setStyle(value);
    }

    super.applyValue(config, value);
  }
}

exports = TileLayerStyle;
