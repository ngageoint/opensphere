goog.module('os.interaction.DoubleClick');

const {insert} = goog.require('goog.array');
const Feature = goog.require('ol.Feature');
const MapBrowserEventType = goog.require('ol.MapBrowserEventType');
const ViewHint = goog.require('ol.ViewHint');
const Interaction = goog.require('ol.interaction.Interaction');
const I3DSupport = goog.require('os.I3DSupport');
const {getLayer} = goog.require('os.feature');
const osImplements = goog.require('os.implements');
const VectorLayer = goog.require('os.layer.Vector');
const launchMultiFeatureInfo = goog.require('os.ui.feature.launchMultiFeatureInfo');


/**
 * Handles the behavior of double clicking on a feature.
 *
 * @implements {I3DSupport}
 */
class DoubleClick extends Interaction {
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
              var vector = /** @type {os.layer.Vector} */ (layer);
              var id = vector.getId();

              if (vector && id) {
                insert(features, feature);
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

exports = DoubleClick;
