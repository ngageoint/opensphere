goog.declareModuleId('os.interaction.ContextMenu');

import {normalizeLongitude} from '../geo/geo2.js';
import I3DSupport from '../i3dsupport.js';
import osImplements from '../implements.js';
import OLContextMenu from '../ui/ol/interaction/contextmenuinteraction.js';
import {getFeatureResult} from './interaction.js';

const {default: ContextMenuOptions} = goog.requireType('os.ui.ol.interaction.ContextMenuOptions');


/**
 * Context menu interactions for map clicks.
 *
 * @implements {I3DSupport}
 */
export default class ContextMenu extends OLContextMenu {
  /**
   * Constructor.
   * @param {ContextMenuOptions=} opt_options Options.
   */
  constructor(opt_options) {
    super(opt_options);

    // Protractor's mouseDown/mouseUp actions don't work with the Closure event framework (not sure why), so export a
    // function to open the map context menu.
    window['omcm'] = this.openMapContextMenu.bind(this);
  }

  /**
   * @inheritDoc
   */
  is3DSupported() {
    return true;
  }

  /**
   * @inheritDoc
   */
  handleEventInternal(event) {
    if (event.map && event.pixel) {
      var feature;
      var layer;

      if (event.pixel) {
        var result = event.map.forEachFeatureAtPixel(event.pixel, getFeatureResult);
        if (result) {
          feature = result.feature;
          layer = result.layer;
        }
      }

      if (feature) {
        this.openFeatureContextMenu(event, feature, layer);
      } else {
        // for the default map context menu, open it even if the pixel isn't available
        var pixel = event.pixel || [0, 0];
        var coord = event.map.getCoordinateFromPixel(pixel);

        if (coord) {
          coord[0] = normalizeLongitude(coord[0]);
        }

        this.openMapContextMenu(coord, pixel);
      }
    }
  }
}

osImplements(ContextMenu, I3DSupport.ID);
