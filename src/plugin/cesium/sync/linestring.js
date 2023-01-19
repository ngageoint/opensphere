goog.declareModuleId('plugin.cesium.sync.linestring');

import GeometryType from 'ol/src/geom/GeometryType.js';
import olcsCore from 'ol-cesium/src/olcs/core.js';

import * as interpolate from '../../../os/interpolate.js';
import InterpolationMethod from '../../../os/interpolatemethod.js';
import {dashPatternToOptions} from '../../../os/style/style.js';
import {GeometryInstanceId} from '../cesium.js';
import {createGeometryInstance} from '../primitive.js';
import {getTransformFunction} from './gettransformfunction.js';
import {getHeightReference} from './heightreference.js';
import {getColor, getLineWidthFromStyle} from './style.js';

const {assert} = goog.require('goog.asserts');


/**
 * Convert an OpenLayers line string geometry to Cesium.
 *
 * @param {!Feature} feature Ol3 feature..
 * @param {!(LineString|MultiLineString)} geometry Ol3 line string geometry.
 * @param {!Style} style
 * @param {!VectorContext} context
 * @param {Array<number>=} opt_flatCoords
 * @param {number=} opt_offset
 * @param {number=} opt_end
 * @param {number=} opt_index
 * @return {Cesium.Primitive}
 */
export const createLineStringPrimitive = (feature, geometry, style, context, opt_flatCoords, opt_offset, opt_end,
    opt_index) => {
  assert(geometry.getType() == GeometryType.LINE_STRING || geometry.getType() == GeometryType.MULTI_LINE_STRING);

  const heightReference = getHeightReference(context.layer, feature, geometry, opt_index);
  const lineGeometryToCreate = geometry.get('extrude') ? 'WallGeometry' :
    heightReference === Cesium.HeightReference.CLAMP_TO_GROUND ? 'GroundPolylineGeometry' : 'PolylineGeometry';
  const positions = getLineStringPositions(geometry, opt_flatCoords, opt_offset, opt_end);
  const method = /** @type {InterpolationMethod} */ (geometry.get(interpolate.METHOD_FIELD)) ||
  /** @type {InterpolationMethod} */ (feature.get(interpolate.METHOD_FIELD));
  return createLinePrimitive(positions, context, style, lineGeometryToCreate, method);
};


/**
 * Get the Cesium arc type from the interpolation method.
 * @param {InterpolationMethod=} opt_method The interpolation method.
 * @return {Cesium.ArcType}
 */
const getArcType = (opt_method) => {
  let arcType = Cesium.ArcType.NONE;

  const method = opt_method || interpolate.getMethod();
  switch (method) {
    case InterpolationMethod.NONE:
      arcType = Cesium.ArcType.NONE;
      break;
    case InterpolationMethod.GEODESIC:
      arcType = Cesium.ArcType.GEODESIC;
      break;
    case InterpolationMethod.RHUMB:
      arcType = Cesium.ArcType.RHUMB;
      break;
    default:
      break;
  }

  return arcType;
};


/**
 * Create a Cesium line primitive.
 *
 * @param {!Array<!Cesium.Cartesian3>} positions The geometry positions.
 * @param {!VectorContext} context The vector context.
 * @param {!Style} style The feature style.
 * @param {string=} opt_type The line geometry type.
 * @param {InterpolationMethod=} opt_method The interpolation method
 * @return {Cesium.Primitive}
 */
const createLinePrimitive = (positions, context, style, opt_type, opt_method) => {
  const type = opt_type || 'PolylineGeometry';
  opt_method = opt_method || interpolate.getMethod();

  let geometryId = GeometryInstanceId.GEOM_OUTLINE;
  let color = getColor(style, context, geometryId);
  const width = getLineWidthFromStyle(style);
  const lineDash = getDashPattern(style);

  let appearance;
  if (type.endsWith('PolylineGeometry')) {
    if (lineDash) {
      appearance = new Cesium.PolylineMaterialAppearance({
        material: Cesium.Material.fromType(Cesium.Material.PolylineDashType, {
          color,
          dashPattern: lineDash
        })
      });
    } else {
      appearance = new Cesium.PolylineColorAppearance();
    }
  } else {
    geometryId = GeometryInstanceId.GEOM;
    color = getColor(style, context, geometryId);
    appearance = new Cesium.PerInstanceColorAppearance();
  }

  // Handle both color and width
  const geometry = new Cesium[type]({
    positions: positions,
    vertexFormat: appearance.vertexFormat,
    arcType: getArcType(opt_method),
    width: width
  });

  const instance = createGeometryInstance(geometryId, geometry, color);

  const primitiveType = opt_type && opt_type.startsWith('Ground') ? Cesium.GroundPolylinePrimitive : Cesium.Primitive;
  const primitive = new primitiveType({
    geometryInstances: instance,
    appearance: appearance
  });

  // Cesium doesn't make line width accessible once the primitive is loaded to the GPU, so we need to save it.
  primitive['olLineWidth'] = width;

  return primitive;
};


/**
 * Line dash configurations for Cesium
 * @type {!Array<number|undefined>}
 * @const
 */
const LINE_STYLE_OPTIONS = [
  undefined, // []
  parseInt('1111111111110000', 2), // [12, 4]
  parseInt('1111111100000000', 2), // [8, 8]
  parseInt('1111100011111000', 2), // [4, 4, 4, 4]
  parseInt('1111100000000000', 2), // [4, 12]
  parseInt('1110000011100000', 2), // [2, 6, 2, 6]
  parseInt('1111110000111000', 2), // [5, 5, 1, 5]
  parseInt('1111111110011100', 2) // [7, 4, 1, 4]
];


/**
 * Convert a style's line dash to 16 bit int
 *
 * @param {!(Style|Text)} style
 * @return {number|undefined}
 */
export const getDashPattern = (style) => {
  const stroke = style.getStroke();
  const dashPattern = stroke != null ? stroke.getLineDash() : undefined;
  const id = dashPatternToOptions(dashPattern).id;
  return LINE_STYLE_OPTIONS[id];
};

/**
 * @param {!Array<!Cesium.PrimitiveLike>|!Cesium.PrimitiveLike} primitive
 * @param {!(Style|Text)} style
 * @return {boolean}
 */
export const isLineWidthChanging = (primitive, style) => {
  if (primitive) {
    if (Array.isArray(primitive)) {
      return primitive.length ? isLineWidthChanging(primitive[0], style) : false;
    } else if (primitive['olLineWidth'] != null) {
      const width = getLineWidthFromStyle(style);
      return primitive['olLineWidth'] != width;
    }
  }

  return false;
};

/**
 * @param {!Array<!Cesium.PrimitiveLike>|!Cesium.PrimitiveLike} primitive
 * @param {!(Style|Text)} style
 * @return {boolean}
 */
export const isDashChanging = (primitive, style) => {
  if (Array.isArray(primitive)) {
    return primitive.length ? isDashChanging(primitive[0], style) : false;
  }

  return isDashPatternChanging(primitive, getDashPattern(style));
};


/**
 * @param {!Cesium.PrimitiveLike} primitive
 * @param {number|undefined} dashPattern
 * @return {boolean}
 */
const isDashPatternChanging = (primitive, dashPattern) => {
  if (primitive.length) {
    for (let i = 0; i < primitive.length; i++) {
      if (isDashPatternChanging(primitive.get(i), dashPattern)) {
        return true;
      }
    }
  } else if (primitive.appearance && primitive.appearance.material &&
        primitive.appearance.material.uniforms) {
    return primitive.appearance.material.uniforms.dashPattern != dashPattern;
  }

  return dashPattern != null;
};


/**
 * @type {!Coordinate}
 * @const
 */
const scratchCoord1 = [];


/**
 * @type {!Coordinate}
 * @const
 */
const scratchCoord2 = [];


/**
 * @param {!(LineString|Ellipse|MultiLineString|Polygon|MultiPolygon)} geometry Ol3 line string geometry.
 * @param {Array<number>=} opt_flatCoords The flat coordinates from a multiline
 * @param {number=} opt_offset
 * @param {number=} opt_end
 * @return {!Array<Cesium.Cartesian3>}
 */
export const getLineStringPositions = (geometry, opt_flatCoords, opt_offset, opt_end) => {
  const transform = getTransformFunction();
  const flats = opt_flatCoords || geometry.getFlatCoordinates();
  const stride = geometry.stride;
  const offset = opt_offset || 0;
  const end = opt_end || flats.length;

  const coord = scratchCoord1;
  const transformedCoord = scratchCoord2;
  coord.length = stride;
  transformedCoord.length = stride;

  const positions = new Array((end - offset) / stride);
  let count = 0;
  for (let i = offset; i < end; i += stride) {
    for (let j = 0; j < stride; j++) {
      coord[j] = flats[i + j];
      transformedCoord[j] = coord[j];
    }

    if (transform) {
      transform(coord, transformedCoord, stride);
    }

    positions[count] = olcsCore.ol4326CoordinateToCesiumCartesian(transformedCoord);
    count++;
  }

  return positions;
};
