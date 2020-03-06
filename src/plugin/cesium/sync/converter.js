goog.module('plugin.cesium.sync.converter');

const DynamicFeature = goog.require('os.feature.DynamicFeature');
const GeometryType = goog.require('ol.geom.GeometryType');
const DynamicLineStringConverter = goog.require('plugin.cesium.sync.DynamicLineStringConverter');
const Ellipse = goog.require('os.geom.Ellipse');
const EllipseConverter = goog.require('plugin.cesium.sync.EllipseConverter');
const GeometryCollectionConverter = goog.require('plugin.cesium.sync.GeometryCollectionConverter');
const LabelConverter = goog.require('plugin.cesium.sync.LabelConverter');
const LineStringConverter = goog.require('plugin.cesium.sync.LineStringConverter');
const MultiDynamicLineStringConverter = goog.require('plugin.cesium.sync.MultiDynamicLineStringConverter');
const MultiLineStringConverter = goog.require('plugin.cesium.sync.MultiLineStringConverter');
const MultiPointConverter = goog.require('plugin.cesium.sync.MultiPointConverter');
const MultiPolygonConverter = goog.require('plugin.cesium.sync.MultiPolygonConverter');
const PointConverter = goog.require('plugin.cesium.sync.PointConverter');
const PolygonConverter = goog.require('plugin.cesium.sync.PolygonConverter');
const {runConverter} = goog.require('plugin.cesium.sync.runConverter');

const IConverter = goog.requireType('plugin.cesium.sync.IConverter');
const Feature = goog.requireType('ol.Feature');
const Geometry = goog.requireType('ol.geom.Geometry');
const Style = goog.requireType('ol.style.Style');
const VectorContext = goog.requireType('plugin.cesium.VectorContext');

/**
 * @param {!Feature} feature
 * @param {!Geometry} geometry
 * @param {!Style} style
 * @param {!VectorContext} context
 */
const convertGeometry = (feature, geometry, style, context) => {
  const converter = getConverter(feature, geometry, style, context);

  if (converter) {
    runConverter(converter, feature, geometry, style, context);
  } else {
    // TODO: log or throw error about no converter found
  }
};


/**
 * @type {Object<string, !IConverter>}
 */
const converters = {
  [GeometryType.GEOMETRY_COLLECTION]: new GeometryCollectionConverter,
  [GeometryType.LINE_STRING]: new LineStringConverter,
  [GeometryType.MULTI_LINE_STRING]: new MultiLineStringConverter,
  [GeometryType.MULTI_POINT]: new MultiPointConverter,
  [GeometryType.MULTI_POLYGON]: new MultiPolygonConverter,
  [GeometryType.POINT]: new PointConverter,
  [GeometryType.POLYGON]: new PolygonConverter,
  label: new LabelConverter,
  ellipse: new EllipseConverter
};


GeometryCollectionConverter.setConvertFunction(convertGeometry);


/**
 * @type {Object<string, !IConverter>}
 */
const dynamicConverters = {
  [GeometryType.LINE_STRING]: new DynamicLineStringConverter,
  [GeometryType.MULTI_LINE_STRING]: new MultiDynamicLineStringConverter
};


/**
 * @param {!Feature} feature
 * @param {!Geometry} geometry
 * @param {!Style} style
 * @param {!VectorContext} context
 * @return {IConverter|undefined}
 */
const getConverter = (feature, geometry, style, context) => {
  const geometryType = geometry.getType();

  if (style && style.getText()) {
    return converters.label;
  }

  if (feature instanceof DynamicFeature && geometryType in dynamicConverters) {
    return dynamicConverters[geometryType];
  }

  if (geometry instanceof Ellipse) {
    return converters.ellipse;
  }

  return converters[geometryType];
};


exports = {
  convertGeometry,
  getConverter
};
