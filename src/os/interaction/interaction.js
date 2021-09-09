goog.module('os.interaction');

const Feature = goog.require('ol.Feature');
const OLVectorLayer = goog.require('ol.layer.Vector');
const VectorTile = goog.require('ol.layer.VectorTile');
const RecordField = goog.require('os.data.RecordField');
const {getLayer} = goog.require('os.feature');
const {getMapContainer} = goog.require('os.map.instance');

const Layer = goog.requireType('ol.layer.Layer');
const RenderFeature = goog.requireType('ol.render.Feature');


/**
 * Event types for the modify interaction.
 * @enum {string}
 */
const ModifyEventType = {
  COMPLETE: 'modify:complete',
  CANCEL: 'modify:cancel'
};

/**
 * Rotation delta, in radians.
 * @type {number}
 */
const ROTATE_DELTA = Math.PI / 60;

/**
 * Feature hit detection callback.
 *
 * @param {(Feature|RenderFeature)} feature The feature
 * @param {Layer} layer The layer containing the feature
 * @return {osx.interaction.FeatureResult|undefined} The hit detection result.
 */
const getFeatureResult = function(feature, layer) {
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
const getZoomDelta = function(boost, inverse) {
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
const defaultLayerFilter = function(layer) {
  //
  // Unmanaged layers aren't automatically included in hit detection, so the OLVectorLayer check is intended to
  // cover those layers.
  //
  // Vector Tiles are excluded because they implement more specific interactions for performance reasons.
  //
  return layer instanceof OLVectorLayer && !(layer instanceof VectorTile);
};

exports = {
  ModifyEventType,
  ROTATE_DELTA,
  getFeatureResult,
  getZoomDelta,
  defaultLayerFilter
};
