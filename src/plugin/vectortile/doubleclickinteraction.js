goog.module('plugin.vectortile.DoubleClick');

goog.require('os.mixin.renderfeature');
goog.require('os.ui.feature.multiFeatureInfoDirective');

const {getUid} = goog.require('ol');
const OLMap = goog.require('ol.Map');
const MapBrowserEventType = goog.require('ol.MapBrowserEventType');
const ViewHint = goog.require('ol.ViewHint');
const Interaction = goog.require('ol.interaction.Interaction');
const Feature = goog.require('ol.render.Feature');
const I3DSupport = goog.require('os.I3DSupport');
const osImplements = goog.require('os.implements');
const VectorTile = goog.require('os.layer.VectorTile');

const OSMap = goog.requireType('os.Map');


/**
 * Double click event handler.
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} 'false' to stop event propagation.
 */
const handleEvent = (mapBrowserEvent) => {
  const map = mapBrowserEvent.map;
  const features = [];

  if (mapBrowserEvent.type == MapBrowserEventType.DBLCLICK && map.getView().getHints()[ViewHint.INTERACTING] == 0) {
    // Do a 2D-only forEachFeatureAtPixel for items in a VectorTileLayer. 3D contexts
    // only have the resulting raster tile.
    const pixel2D = /** @type {OSMap} */ (map).get2DPixelFromCoordinate(mapBrowserEvent.coordinate);
    OLMap.prototype.forEachFeatureAtPixel.call(map, pixel2D, function(feature, layer) {
      if (layer instanceof VectorTile && feature instanceof Feature) {
        feature['id'] = getUid(feature);
        features.push(feature);
      }
    });

    if (features.length > 0) {
      os.ui.feature.launchMultiFeatureInfo(features);
    }
  }

  return !features.length;
};


/**
 * Handles the behavior of double clicking on a feature.
 * @implements {I3DSupport}
 */
class DoubleClick extends Interaction {
  /**
   * Constructor.
   */
  constructor() {
    super({
      handleEvent
    });
  }

  /**
   * @inheritDoc
   */
  is3DSupported() {
    return true;
  }
}

osImplements(DoubleClick, I3DSupport.ID);

exports = DoubleClick;
