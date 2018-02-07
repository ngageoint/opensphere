/**
 * @fileoverview Mixins to OL3 and Cesium to replace private/protected vendor code that doesn't meet our requirements.
 * @suppress {missingProvide}
 */
goog.provide('os.mixin');

goog.require('goog.math');
goog.require('ol.View');
goog.require('ol.color');
goog.require('ol.extent');
goog.require('ol.math');
goog.require('ol.renderer.canvas.Map');
goog.require('ol.renderer.canvas.VectorLayer');
goog.require('os.mixin.ResolutionConstraint');
goog.require('os.mixin.TileImage');
goog.require('os.mixin.UrlTileSource');
goog.require('os.mixin.feature');
goog.require('os.mixin.geometry');
goog.require('os.mixin.layerbase');
goog.require('os.mixin.map');
goog.require('os.mixin.object');
goog.require('os.net');
goog.require('os.ol');
goog.require('os.registerClass');


/**
 * Class name
 * @type {string}
 * @const
 */
ol.layer.Group.NAME = 'ol.layer.Group';
os.registerClass(ol.layer.Group.NAME, ol.layer.Group);


/**
 * Clamps opacity precision to two decimal places.
 * @override
 * @suppress {accessControls|duplicate}
 */
ol.color.normalize = function(color, opt_color) {
  var result = opt_color || [];
  result[0] = ol.math.clamp((color[0] + 0.5) | 0, 0, 255);
  result[1] = ol.math.clamp((color[1] + 0.5) | 0, 0, 255);
  result[2] = ol.math.clamp((color[2] + 0.5) | 0, 0, 255);
  result[3] = Math.round(ol.math.clamp(color[3], 0, 1) * 100) / 100;
  return result;
};


/**
 * Mixin to override the non-use of the frameState.skippedFeatureUids property. OL3's renderer does not skip
 * hidden features for the sake of hit detection, which is not only slower, but also causes them to be highlighted
 * on hover even if they are hidden. Fixes THIN-7359.
 * @inheritDoc
 *
 * @suppress {accessControls|duplicate}
 */
ol.renderer.canvas.VectorLayer.prototype.forEachFeatureAtCoordinate = function(coordinate, frameState, hitTolerance,
    callback, thisArg) {
  if (!this.replayGroup_) {
    return undefined;
  } else {
    var resolution = frameState.viewState.resolution;
    var rotation = frameState.viewState.rotation;
    var skippedFeatures = frameState.skippedFeatureUids;
    var layer = this.getLayer();
    /** @type {Object.<string, boolean>} */
    var features = {};
    return this.replayGroup_.forEachFeatureAtCoordinate(coordinate, resolution,
        rotation, hitTolerance, skippedFeatures,
        /**
         * @param {ol.Feature|ol.render.Feature} feature Feature.
         * @return {?} Callback result.
         */
        function(feature) {
          var key = ol.getUid(feature).toString();
          if (!(key in features)) {
            features[key] = true;
            return callback.call(thisArg, feature, layer);
          }
        }, null);
  }
};


(function() {
  var originalRenderFrame = ol.renderer.canvas.Map.prototype.renderFrame;

  /**
   * @inheritDoc
   * @suppress {accessControls}
   */
  ol.renderer.canvas.Map.prototype.renderFrame = function(frameState) {
    if (frameState && os.MapContainer.getInstance().is3DEnabled()) {
      frameState.viewState.rotation = 0;
    }

    // Browsers differ wildly in their interpretation of style.width/height = 100%
    // on a canvas and how that style width/height is related to the canvas width/height.
    //
    // Most of the problems seem to crop up on high resolution displays such as Apple's
    // Retina displays (or really anything that sets window.devicePixelRatio to something
    // other than 1).
    //
    // Therefore, we will manually keep the style width/height in exact pixels.

    if (frameState) {
      var canvas = this.canvas_;
      var widthPx = frameState.size[0] + 'px';
      var heightPx = frameState.size[1] + 'px';

      if (canvas.style.width !== widthPx) {
        canvas.style.width = widthPx;
      }

      if (canvas.style.height !== heightPx) {
        canvas.style.height = heightPx;
      }
    }

    originalRenderFrame.call(this, frameState);
  };
})();
