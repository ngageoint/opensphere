goog.declareModuleId('os.command.TileLayerStyle');

import instanceOf from '../instanceof.js';
import LayerClass from '../layer/layerclass.js';
import {getMapContainer} from '../map/mapinstance.js';
import AbstractLayerStyle from './abstractlayerstylecmd.js';

const {default: Tile} = goog.requireType('os.layer.Tile');


/**
 * Changes the style of a tile layer
 */
export default class TileLayerStyle extends AbstractLayerStyle {
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
