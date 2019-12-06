goog.module('plugin.cesium.sync.EllipseConverter');

const DynamicLineStringConverter = goog.require('plugin.cesium.sync.DynamicLineStringConverter');
const ILayer = goog.require('os.layer.ILayer');
const LineString = goog.require('ol.geom.LineString');
const StyleField = goog.require('os.style.StyleField');
const StyleManager = goog.require('os.style.StyleManager');
const {runConverter} = goog.require('plugin.cesium.sync.runConverter');
const implementz = goog.require('os.implements');
const EllipsoidConverter = goog.require('plugin.cesium.sync.EllipsoidConverter');
const PolygonConverter = goog.require('plugin.cesium.sync.PolygonConverter');

const Feature = goog.requireType('ol.Feature');
const Ellipse = goog.requireType('os.geom.Ellipse');
const Style = goog.requireType('ol.style.Style');
const VectorContext = goog.requireType('plugin.cesium.VectorContext');
const {CreateFunction, UpdateFunction, Converter} = goog.requireType('plugin.cesium.sync.ConverterTypes');

/**
 * @type {CreateFunction}
 */
const create = (feature, geometry, style, context) => {
  const returnVal = getConverter(context).create(feature, geometry, style, context);

  if (returnVal) {
    createOrUpdateGroundReference(feature, geometry, style, context);
  }

  return returnVal;
};


/**
 * @type {UpdateFunction}
 */
const update = (feature, geometry, style, context, primitive) => {
  const returnVal = getConverter(context).update(feature, geometry, style, context, primitive);

  if (returnVal) {
    createOrUpdateGroundReference(feature, geometry, style, context);
  }

  return returnVal;
};


/**
 * @param {VectorContext} context
 * @return {Converter}
 */
const getConverter = (context) => {
  return isEllipsoid(context) ? EllipsoidConverter : PolygonConverter;
};


/**
 * @param {VectorContext} context
 * @return {boolean}
 */
const isEllipsoid = (context) => {
  const layer = /** @type {os.layer.ILayer} */ (context.layer);
  const config = StyleManager.getInstance().getLayerConfig(layer.getId());
  return config && config[StyleField.SHOW_ELLIPSOIDS];
};


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


/**
 * @type {Converter}
 */
exports = {
  create,
  retrieve: PolygonConverter.retrieve,
  update,
  delete: PolygonConverter.delete
};
