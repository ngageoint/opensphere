goog.declareModuleId('os.mixin.VectorImageTile');

import VectorImageTile from 'ol/src/VectorRenderTile.js';

import VectorTile from '../layer/vectortile.js';
import MapContainer from '../mapcontainer.js';

/**
 * Local reference to the MapContainer instance.
 * @type {MapContainer|undefined}
 */
let mapContainer;

/**
 * OpenLayers does not actually draw inside the vector tiles. Rather, those
 * tiles are rendered by the vector tile renderer later. This is problematic
 * because the OpenLayers renderers do not run when syncing to a WebGL context.
 *
 * This override copies the main tile drawing logic from the VectorTile canvas
 * renderer and runs it immediately if the `getImage` method returns nothing.
 *
 * @param {OLLayer} layer
 * @return {HTMLCanvasElement} Canvas.
 *
 * @suppress {accessControls} To provide access to frameState.
 */
VectorImageTile.prototype.getDrawnImage = function(layer) {
  let canvas = this.getImage(layer);

  if (!mapContainer) {
    mapContainer = MapContainer.getInstance();
  }

  if (!canvas && mapContainer && layer instanceof VectorTile) {
    const map = mapContainer.getMap();
    if (map) {
      const frameState = map.frameState_;
      if (frameState) {
        const renderer = layer.getRenderer();

        renderer.createReplayGroup_(this, frameState);
        renderer.renderTileImage_(this, frameState, /** @type {ol.LayerState} */ ({}));

        canvas = this.getImage(layer);
      }
    }
  }

  return canvas;
};
