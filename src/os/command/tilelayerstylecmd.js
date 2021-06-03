goog.module('os.command.TileLayerStyle');
goog.module.declareLegacyNamespace();

const AbstractLayerStyle = goog.require('os.command.AbstractLayerStyle');


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
    var layer = os.MapContainer.getInstance().getLayer(this.layerId);
    return layer instanceof os.layer.Tile ? layer.getStyle() : null;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    var layer = os.MapContainer.getInstance().getLayer(this.layerId);
    if (layer instanceof os.layer.Tile) {
      layer.setStyle(value);
    }

    super.applyValue(config, value);
  }
}

exports = TileLayerStyle;
