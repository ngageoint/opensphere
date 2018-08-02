goog.provide('os.interaction');

goog.require('ol.layer.Vector');
goog.require('os.feature');
goog.require('os.map');


/**
 * Feature hit detection callback.
 * @param {(ol.Feature|ol.render.Feature)} feature The feature
 * @param {ol.layer.Layer} layer The layer containing the feature
 * @return {osx.interaction.FeatureResult|undefined} The hit detection result.
 */
os.interaction.getFeatureResult = function(feature, layer) {
  if (feature instanceof ol.Feature) {
    // do not hit detect "preview" features
    if (feature.get(os.data.RecordField.DRAWING_LAYER_NODE) === false) {
      return undefined;
    }

    if (!layer) {
      layer = os.feature.getLayer(feature);
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
 * @param {boolean} boost If the delta should be boosted
 * @param {boolean} inverse If the delta should be inverted
 * @return {number}
 */
os.interaction.getZoomDelta = function(boost, inverse) {
  var delta;

  var mapContainer = os.MapContainer.getInstance();
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
 * @param {ol.layer.Layer} layer Layer.
 * @return {boolean} Include.
 */
os.interaction.defaultLayerFilter = function(layer) {
  // unmanaged layers aren't automatically included in hit detection, so the ol.layer.Vector check is intended to
  // cover those layers
  return layer instanceof ol.layer.Vector;
};
