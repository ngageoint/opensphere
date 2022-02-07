goog.declareModuleId('os.ui.ol.interaction.FocusInteraction');


import Interaction from 'ol/interaction/Interaction';
import {getAreaManager} from '../../../query/queryinstance.js';

const MapBrowserEvent = goog.requireType('ol.MapBrowserEvent');
const {default: OLMap} = goog.requireType('os.ui.ol.OLMap');


/**
 * Handle if the map is focused or not
 */
export default class FocusInteraction extends Interaction {
  /**
   * Constructor.
   * @param {olx.interaction.InteractionOptions=} opt_options Options.
   */
  constructor(opt_options) {
    super({
      handleEvent: FocusInteraction.handleEvent
    });

    this.setActive(true);
    this.focused_ = false;
  }

  /**
   * @param {MapBrowserEvent} mapBrowserEvent
   * @return {boolean} `false` to stop event propagation
   */
  static handleEvent(mapBrowserEvent) {
    const map = /** @type {OLMap} */ (getAreaManager().getMap());

    if (mapBrowserEvent.pointerEvent && mapBrowserEvent.pointerEvent.buttons) {
      map.setFocused(true);
    }

    // Always stop events unless the map has been focused
    return map.getFocused();
  }
}
