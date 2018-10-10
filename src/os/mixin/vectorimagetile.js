/**
 * @fileoverview Modifications to {@link ol.VectorImageTile}
 */
goog.provide('os.mixin.VectorImageTile');

goog.require('ol.VectorImageTile');


os.mixin.VectorImageTile.tmpTransform = ol.transform.create();

/**
 * OpenLayers does not actually draw inside the vector tiles. Rather, those
 * tiles are rendered by the vector tile renderer later. This is problematic
 * because the OpenLayers renderers do not run when syncing to a WebGL context.
 *
 * This override copies the main tile drawing logic from the VectorTile canvas
 * renderer and runs it immediately if the `getImage` method returns nothing.
 *
 * @param {ol.layer.Layer} layer
 * @return {HTMLCanvasElement} Canvas.
 * @suppress {visibility}
 */
ol.VectorImageTile.prototype.getDrawnImage = function(layer) {
  var canvas = this.getImage(layer);

  if (!canvas && layer instanceof os.layer.VectorTile) {
    var frameState = os.map.mapContainer.getMap().frameState_;
    if (frameState) {
      var renderer = layer.getRenderer();

      renderer.createReplayGroup_(this, frameState);
      renderer.renderTileImage_(this, frameState, /** @type {ol.LayerState} */ ({}));

      canvas = this.getImage(layer);
    }
  }

  return canvas;
};
