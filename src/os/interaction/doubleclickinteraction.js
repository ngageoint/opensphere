goog.declareModuleId('os.interaction.DoubleClick');

import {getLayer} from '../feature/feature.js';
import I3DSupport from '../i3dsupport.js';
import osImplements from '../implements.js';
import VectorLayer from '../layer/vector.js';
import launchMultiFeatureInfo from '../ui/feature/launchmultifeatureinfo.js';

const Feature = goog.require('ol.Feature');
const MapBrowserEventType = goog.require('ol.MapBrowserEventType');
const ViewHint = goog.require('ol.ViewHint');
const Interaction = goog.require('ol.interaction.Interaction');


/**
 * Handles the behavior of double clicking on a feature.
 *
 * @implements {I3DSupport}
 */
export default class DoubleClick extends Interaction {
  /**
   * Constructor.
   */
  constructor() {
    super({
      handleEvent: DoubleClick.handleEvent_
    });

    /**
     * @type {boolean}
     * @private
     */
    this.supports3D_ = true;
  }

  /**
   * @inheritDoc
   */
  is3DSupported() {
    return this.supports3D_;
  }

  /**
   * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
   * @return {boolean} 'false' to stop event propagation.
   * @this os.interaction.DoubleClick
   * @private
   */
  static handleEvent_(mapBrowserEvent) {
    var map = mapBrowserEvent.map;
    var features = [];

    if (mapBrowserEvent.type == MapBrowserEventType.DBLCLICK &&
        map.getView().getHints()[ViewHint.INTERACTING] == 0) {
      try {
        var options = {
          'drillPick': true
        };

        map.forEachFeatureAtPixel(mapBrowserEvent.pixel, function(feature, layer) {
          if (feature instanceof Feature) {
            if (!layer || !(layer instanceof VectorLayer)) {
              // might be an animation overlay - try to find the original layer
              layer = getLayer(feature);
            }

            if (layer instanceof VectorLayer) {
              var vector = /** @type {VectorLayer} */ (layer);
              var id = vector.getId();

              if (vector && id && !features.includes(feature)) {
                features.push(feature);
              }
            }
          }
        }, options);

        if (features.length > 0) {
          launchMultiFeatureInfo(features);
        }
      } catch (e) {
      }
    }

    return !features.length;
  }
}

osImplements(DoubleClick, I3DSupport.ID);
