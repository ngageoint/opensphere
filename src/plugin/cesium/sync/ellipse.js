goog.module('plugin.cesium.sync.ellipse');

const DynamicLineStringConverter = goog.require('plugin.cesium.sync.DynamicLineStringConverter');
const Feature = goog.requireType('ol.Feature');
const Ellipse = goog.requireType('os.geom.Ellipse');
const Style = goog.requireType('ol.style.Style');
const VectorContext = goog.requireType('plugin.cesium.VectorContext');
const {runConverter} = goog.require('plugin.cesium.sync.runConverter');

/**
 * Get a ground reference line from a coordinate to the surface of the globe.
 *
 * @param {!Feature} feature Ol3 feature
 * @param {!Ellipse} geometry Ellipse geometry.
 * @param {!Style} style The style
 * @param {!VectorContext} context The vector context
 */
const createOrUpdateGroundReference = (feature, geometry, style, context) => {
  let groundRef = null;

  if (implementz(context.layer, ILayer.ID)) {
    // check if the ground reference should be displayed
    const layer = /** @type {ILayer} */ (context.layer);
    const layerId = layer.getId();
    const config = StyleManager.getInstance().getLayerConfig(layerId);
    if (config && config[StyleField.SHOW_GROUND_REF]) {
      const center = geometry.getCenter();
      const height = center[2];

      if (height) {
        const key = '_groundRefGeom';

        const surface = center.slice();
        surface[2] = 0;

        const coordinates = [center, surface];
        groundRef = /** @type {LineString|undefined} */ (feature.get(key));

        if (!groundRef) {
          groundRef = new LineString(coordinates);
        } else {
          const currCoords = groundRef.getCoordinates();
          if (Math.abs(currCoords[0][0] - center[0]) > 1E-9 || Math.abs(currCoords[0][1] - center[1]) > 1E-9) {
            groundRef.setCoordinates(coordinates);
          }
        }

        feature.set(key, groundRef, true);
      }
    }
  }

  if (groundRef) {
    runConverter(DynamicLineStringConverter, feature, groundRef, style, context);
  }
};

exports = {
  createOrUpdateGroundReference
};

