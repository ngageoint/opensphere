goog.declareModuleId('os.command.TileLayerColorize');

import instanceOf from '../instanceof.js';
import LayerClass from '../layer/layerclass.js';
import {getMapContainer} from '../map/mapinstance.js';
import AbstractLayerStyle from './abstractlayerstylecmd.js';

const {default: TileLayer} = goog.requireType('os.layer.Tile');


/**
 * Changes whether a layer is colorized.
 */
export default class TileLayerColorize extends AbstractLayerStyle {
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
