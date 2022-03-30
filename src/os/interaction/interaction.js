goog.declareModuleId('os.interaction');

import Feature from 'ol/src/Feature.js';
import OLVectorLayer from 'ol/src/layer/Vector.js';
import VectorTile from 'ol/src/layer/VectorTile.js';

import RecordField from '../data/recordfield.js';
import {getLayer} from '../feature/feature.js';
import {getMapContainer} from '../map/mapinstance.js';



/**
 * Event types for the modify interaction.
 * @enum {string}
 */
export const ModifyEventType = {
  COMPLETE: 'modify:complete',
  CANCEL: 'modify:cancel'
};

/**
 * Rotation delta, in radians.
 * @type {number}
 */
export const ROTATE_DELTA = Math.PI / 60;

/**
 * Feature hit detection callback.
 *
 * @param {(Feature|RenderFeature)} feature The feature
 * @param {Layer} layer The layer containing the feature
 * @return {osx.interaction.FeatureResult|undefined} The hit detection result.
 */
export const getFeatureResult = function(feature, layer) {
  if (feature instanceof Feature) {
    // do not hit detect "preview" features unless they are flagged as interactive
    if (feature.get(RecordField.DRAWING_LAYER_NODE) === false &&
        !feature.get(RecordField.INTERACTIVE)) {
      return undefined;
    }

    if (!layer) {
      layer = getLayer(feature);
    }

    // if the layer can't be determined, don't return anything
    if (layer) {
      return /** @type {!osx.interaction.FeatureResult} */ ({
        feature: feature,
        layer: layer
      });
    }
  }

  return undefined;
};

/**
 * Get the delta value to use when zooming.
 *
 * @param {boolean} boost If the delta should be boosted
 * @param {boolean} inverse If the delta should be inverted
 * @return {number}
 */
export const getZoomDelta = function(boost, inverse) {
  var delta;

  var mapContainer = getMapContainer();
  if (mapContainer.is3DEnabled()) {
    delta = boost ? 0.5 : 0.9;

    if (inverse) {
      delta = 1 / delta;
    }
  } else {
    delta = boost ? 1 : 0.2;

    if (inverse) {
      delta = -delta;
    }
  }

  return delta;
};

/**
 * @param {Layer} layer Layer.
 * @return {boolean} Include.
 */
export const defaultLayerFilter = function(layer) {
  //
  // Unmanaged layers aren't automatically included in hit detection, so the OLVectorLayer check is intended to
  // cover those layers.
  //
  // Vector Tiles are excluded because they implement more specific interactions for performance reasons.
  //
  return layer instanceof OLVectorLayer && !(layer instanceof VectorTile);
};
