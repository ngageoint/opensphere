/**
 * @fileoverview Mixins to Openlayers to replace private/protected vendor code that doesn't meet our requirements.
 * @suppress {missingProvide}
 */
goog.declareModuleId('os.mixin');

import '../ol/ol.js';
import './featuremixin.js';
import './geometrymixin.js';
import './imagemixin.js';
import './imagesourcemixin.js';
import './layerbasemixin.js';
import './mapmixin.js';
import './objectmixin.js';
import './polygonmixin.js';
import './resolutionconstraintmixin.js';
import './tileimagemixin.js';
import './urltilemixin.js';
import './zoomscalemixin.js';
import './overlaymixin.js';
import './layermixin.js';

import {normalize} from 'ol/src/color.js';
import LayerGroup from 'ol/src/layer/Group.js';
import {clamp} from 'ol/src/math.js';
import VectorLayer from 'ol/src/renderer/canvas/VectorLayer.js';
import MapRenderer from 'ol/src/renderer/Map.js';
import {getUid} from 'ol/src/util.js';

import registerClass from '../registerclass.js';

/**
 * Class name
 * @type {string}
 * @const
 */
LayerGroup.NAME = 'LayerGroup';
registerClass(LayerGroup.NAME, LayerGroup);


/**
 * Clamps opacity precision to two decimal places.
 *
 * @override
 * @suppress {accessControls|duplicate}
 */
normalize.prototype = function(color, opt_color) {
  var result = opt_color || [];
  result[0] = clamp((color[0] + 0.5) | 0, 0, 255);
  result[1] = clamp((color[1] + 0.5) | 0, 0, 255);
  result[2] = clamp((color[2] + 0.5) | 0, 0, 255);
  result[3] = Math.round(clamp(color[3], 0, 1) * 100) / 100;
  return result;
};


/**
 * Mixin to override the non-use of the frameState.skippedFeatureUids property. Openlayers' renderer does not skip
 * hidden features for the sake of hit detection, which is not only slower, but also causes them to be highlighted
 * on hover even if they are hidden. Fixes THIN-7359.
 *
 * @inheritDoc
 *
 * @suppress {accessControls|duplicate}
 */
VectorLayer.prototype.forEachFeatureAtCoordinate = function(coordinate, frameState, hitTolerance,
    callback, thisArg) {
  if (!this.replayGroup_) {
    return undefined;
  } else {
    var resolution = frameState.viewState.resolution;
    var rotation = frameState.viewState.rotation;
    var layer = this.getLayer();
    /** @type {Object.<string, boolean>} */
    var features = {};
    return this.replayGroup_.forEachFeatureAtCoordinate(coordinate, resolution,
        rotation, hitTolerance,
        /**
         * @param {Feature|RenderFeature} feature Feature.
         * @return {?} Callback result.
         */
        function(feature) {
          var key = getUid(feature).toString();
          if (!(key in features)) {
            features[key] = true;
            return callback.call(thisArg, feature, layer);
          }
        }, null);
  }
};

const originalRenderFrame = MapRenderer.prototype.renderFrame;

/**
 * @inheritDoc
 * @suppress {accessControls}
 */
MapRenderer.prototype.renderFrame = function(frameState) {
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
