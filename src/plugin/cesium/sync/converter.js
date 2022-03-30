goog.declareModuleId('plugin.cesium.sync.converter');

import GeometryType from 'ol/src/geom/GeometryType.js';

import DynamicFeature from '../../../os/feature/dynamicfeature.js';
import Ellipse from '../../../os/geom/ellipse.js';
import DynamicLineStringConverter from './dynamiclinestringconverter.js';
import DynamicMultiPolygonConverter from './dynamicmultipolygonconverter.js';
import DynamicPolygonConverter from './dynamicpolygonconverter.js';
import EllipseConverter from './ellipseconverter.js';
import GeometryCollectionConverter from './geometrycollectionconverter.js';
import LabelConverter from './labelconverter.js';
import LineStringConverter from './linestringconverter.js';
import MultiDynamicLineStringConverter from './multidynamiclinestringconverter.js';
import MultiLineStringConverter from './multilinestringconverter.js';
import MultiPointConverter from './multipointconverter.js';
import MultiPolygonConverter from './multipolygonconverter.js';
import PointConverter from './pointconverter.js';
import PolygonConverter from './polygonconverter.js';
import {runConverter} from './runconverter.js';


/**
 * @param {!Feature} feature
 * @param {!Geometry} geometry
 * @param {!Style} style
 * @param {!VectorContext} context
 */
export const convertGeometry = (feature, geometry, style, context) => {
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
  [GeometryType.MULTI_LINE_STRING]: new MultiDynamicLineStringConverter,
  [GeometryType.POLYGON]: new DynamicPolygonConverter,
  [GeometryType.MULTI_POLYGON]: new DynamicMultiPolygonConverter
};


/**
 * @param {!Feature} feature
 * @param {!Geometry} geometry
 * @param {!Style} style
 * @param {!VectorContext} context
 * @return {IConverter|undefined}
 */
export const getConverter = (feature, geometry, style, context) => {
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
