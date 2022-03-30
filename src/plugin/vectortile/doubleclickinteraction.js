goog.declareModuleId('plugin.vectortile.DoubleClick');

import '../../os/mixin/renderfeaturemixin.js';
import Interaction from 'ol/src/interaction/Interaction.js';
import OLMap from 'ol/src/Map.js';
import MapBrowserEventType from 'ol/src/MapBrowserEventType.js';
import RenderFeature from 'ol/src/render/Feature.js';
import {getUid} from 'ol/src/util.js';
import ViewHint from 'ol/src/ViewHint.js';
import I3DSupport from '../../os/i3dsupport.js';
import osImplements from '../../os/implements.js';
import VectorTile from '../../os/layer/vectortile.js';
import MapContainer from '../../os/mapcontainer.js';
import launchMultiFeatureInfo from '../../os/ui/feature/launchmultifeatureinfo.js';


/**
 * Array to hold hit features.
 * @type {!Array<Feature|RenderFeature>}
 */
const features = [];


/**
 * Handle hit feature.
 * @param {Feature|RenderFeature} feature The feature.
 * @param {OLLayer} layer The layer.
 */
const forEachFeatureCallback = (feature, layer) => {
  if (layer instanceof VectorTile && feature instanceof RenderFeature) {
    if (feature['id'] == null) {
      feature['id'] = getUid(feature);
    }
    features.push(feature);
  }
};


/**
 * When OpenLayers isn't the active renderer, vector tile layers are not being rendered fully. We render tiles in the
 * VectorImageTile mixin, but this does not set appropriate fields for hit detection.
 *
 * This function locates the first rendered tile with a replay group at the current zoom level and event coordinate and
 * uses that for hit detection.
 *
 * @param {PluggableMap} map The OL map.
 * @param {VectorTile} layer The layer.
 * @param {ol.Coordinate} coordinate The event coordinate.
 *
 * @suppress {accessControls} To allow access to frameState and renderedTiles.
 */
const glForEachFeatureAtCoordinate = (map, layer, coordinate) => {
  const frameState = map.frameState_;
  const source = /** @type {VectorTileSource} */ (layer.getSource());
  const resolution = map.getView().getResolution();
  if (frameState && source && resolution != null) {
    const tileGrid = source.getTileGridForProjection(frameState.viewState.projection);
    const minZoom = tileGrid.getMinZoom();

    let z = tileGrid.getZForResolution(resolution);
    let tile;

    while (z >= minZoom) {
      const tileCoord = tileGrid.getTileCoordForCoordAndZ(coordinate, z);
      if (tileCoord) {
        tile = source.getTile(...tileCoord, frameState.pixelRatio, frameState.viewState.projection);

        if (tile) {
          const tileCoordKey = tileCoord.toString();
          const sourceTile = tile.getTile(tileCoordKey);
          if (sourceTile && sourceTile.getReplayGroup(layer, tileCoordKey)) {
            break;
          }
        }
      }

      tile = undefined;
      z--;
    }

    if (tile) {
      const renderer = layer.getRenderer();
      renderer.renderedTiles.length = 0;
      renderer.renderedTiles.push(tile);

      renderer.forEachFeatureAtCoordinate(coordinate, frameState, 0, forEachFeatureCallback, this);
    }
  }
};


/**
 * Double click event handler.
 * @param {MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} 'false' to stop event propagation.
 */
const handleEvent = (mapBrowserEvent) => {
  const map = mapBrowserEvent.map;
  features.length = 0;

  if (mapBrowserEvent.type == MapBrowserEventType.DBLCLICK && map.getView().getHints()[ViewHint.INTERACTING] == 0) {
    const mapContainer = MapContainer.getInstance();
    if (map && mapContainer.is3DEnabled()) {
      // forEachFeatureAtPixel does not work in 2D mode because layers are marked as not visible in the frame state
      const vectorTileLayers = /** @type {Array<VectorTile>} */ (mapContainer.getLayers()
          .filter(MapContainer.isVectorTileLayer));
      vectorTileLayers.forEach((layer) => {
        glForEachFeatureAtCoordinate(map, layer, mapBrowserEvent.coordinate);
      });
    } else {
      const pixel2D = /** @type {OSMap} */ (map).get2DPixelFromCoordinate(mapBrowserEvent.coordinate);
      OLMap.prototype.forEachFeatureAtPixel.call(map, pixel2D, forEachFeatureCallback);
    }

    if (features.length > 0) {
      launchMultiFeatureInfo(features.slice());
    }
  }

  return !features.length;
};


/**
 * Handles the behavior of double clicking on a feature.
 * @implements {I3DSupport}
 */
export default class DoubleClick extends Interaction {
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
