goog.declareModuleId('os.command.LayerColor');

import osImplements from '../implements.js';
import IColorableLayer from '../layer/icolorablelayer.js';
import ILayer from '../layer/ilayer.js';
import {getMapContainer} from '../map/mapinstance.js';
import * as osStyle from '../style/style.js';
import AbstractLayerStyle from './abstractlayerstylecmd.js';


/**
 * Changes the color of a layer.
 *
 *
 * @extends {AbstractLayerStyle<Array<number>|string>}
 */
export default class LayerColor extends AbstractLayerStyle {
  /**
   * Constructor.
   * @param {string} layerId The layer id.
   * @param {Array<number>|string} color The new layer color.
   * @param {(Array<number>|string)=} opt_oldColor The old layer color.
   */
  constructor(layerId, color, opt_oldColor) {
    super(layerId, color, opt_oldColor);
    this.title = 'Change Layer Color';

    // make sure the value is a string
    if (color) {
      this.value = osStyle.toRgbaString(color);
    } else {
      var layer = getMapContainer().getLayer(layerId);
      if (osImplements(layer, ILayer.ID)) {
        var options = /** @type {ILayer} */ (layer).getLayerOptions();
        this.value = /** @type {string} */ (options && options['baseColor'] || osStyle.DEFAULT_LAYER_COLOR);
      }
    }
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var layer = getMapContainer().getLayer(this.layerId);
    if (osImplements(layer, IColorableLayer.ID)) {
      return (
        /** @type {IColorableLayer} */
        (layer).getColor()
      );
    }
    return null;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    var layer = getMapContainer().getLayer(this.layerId);
    if (osImplements(layer, IColorableLayer.ID)) {
      /** @type {IColorableLayer} */ (layer).setColor(value);
    }

    super.applyValue(config, value);
  }
}
