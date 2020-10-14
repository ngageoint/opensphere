goog.module('plugin.cesium.sync.EllipseConverter');

const BaseConverter = goog.require('plugin.cesium.sync.BaseConverter');
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
const IConverter = goog.requireType('plugin.cesium.sync.IConverter');

/**
 * Converter for Ellipses
 * @extends {BaseConverter<Ellipse, (Cesium.Polyline|Cesium.PolylineOptions)>}
 */
class EllipseConverter extends BaseConverter {
  /**
   * @inheritDoc
   */
  create(feature, geometry, style, context) {
    const returnVal = getConverter(context).create(feature, geometry, style, context);

    if (returnVal) {
      createOrUpdateGroundReference(feature, geometry, style, context);
    }

    return returnVal;
  }


  /**
   * @inheritDoc
   */
  update(feature, geometry, style, context, primitive) {
    const returnVal = getConverter(context).update(feature, geometry, style, context, primitive);

    if (returnVal) {
      createOrUpdateGroundReference(feature, geometry, style, context);
    }

    return returnVal;
  }
}


const ellipsoidConverter = new EllipsoidConverter();
const polygonConverter = new PolygonConverter();

/**
 * @param {VectorContext} context
 * @return {IConverter}
 */
const getConverter = (context) => isEllipsoid(context) ? ellipsoidConverter : polygonConverter;


/**
 * @param {VectorContext} context
 * @return {boolean}
 */
const isEllipsoid = (context) => {
  const layer = /** @type {os.layer.ILayer} */ (context.layer);
  const config = StyleManager.getInstance().getLayerConfig(layer.getId());
  return config && config[StyleField.SHOW_ELLIPSOIDS];
};


const dynamicConverter = new DynamicLineStringConverter();

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
    runConverter(dynamicConverter, feature, groundRef, style, context);
  }
};


exports = EllipseConverter;
