goog.declareModuleId('plugin.cesium.sync.DynamicLineString');

import {GeometryInstanceId} from '../cesium.js';
import {getDashPattern, getLineStringPositions} from './linestring.js';
import {getColor, getLineWidthFromStyle} from './style.js';


/**
 * @param {!Feature} feature Ol3 feature..
 * @param {!(LineString|Ellipse|MultiLineString|Polygon|MultiPolygon)} geometry Ol3 line string geometry.
 * @param {!Style} style
 * @param {!VectorContext} context
 * @param {Array<number>=} opt_flatCoords The flat coordinates from a multiline
 * @param {number=} opt_offset
 * @param {number=} opt_end
 * @return {!Cesium.PolylineOptions}
 */
export const createPolyline = (feature, geometry, style, context, opt_flatCoords, opt_offset, opt_end) => {
  const polylineOptions = /** @type {Cesium.PolylineOptions} */ ({});
  updatePolyline(feature, geometry, style, context, polylineOptions, opt_flatCoords, opt_offset, opt_end);
  return polylineOptions;
};

/**
 * @param {!Feature} feature Ol3 feature..
 * @param {!(LineString|Ellipse|MultiLineString|Polygon|MultiPolygon)} geometry Ol3 line string geometry.
 * @param {!Style} style
 * @param {!VectorContext} context
 * @param {!(Cesium.Polyline|Cesium.PolylineOptions)} polyline The polyline, for updates.
 * @param {Array<number>=} opt_flatCoords The flat coordinates from a multiline
 * @param {number=} opt_offset
 * @param {number=} opt_end
 */
export const updatePolyline = (feature, geometry, style, context, polyline, opt_flatCoords, opt_offset, opt_end) => {
  const geomRevision = geometry.getRevision();
  if (polyline.geomRevision != geomRevision) {
    polyline.positions = getLineStringPositions(geometry, opt_flatCoords, opt_offset, opt_end);
    polyline.geomRevision = geomRevision;
  }

  const width = getLineWidthFromStyle(style);
  const color = getColor(style, context, GeometryInstanceId.GEOM_OUTLINE);
  const dashPattern = getDashPattern(style);

  const materialOptions = {
    color: color,
    dashPattern: dashPattern
  };

  const materialType = dashPattern != null ? Cesium.Material.PolylineDashType : Cesium.Material.ColorType;
  const material = polyline.material;
  if (!material || material.type != materialType) {
    polyline.material = Cesium.Material.fromType(materialType, materialOptions);
  } else {
    if (!material.uniforms.color.equals(color)) {
      material.uniforms.color = color;
    }
    if (materialType === Cesium.Material.PolylineDashType && material.uniforms.dashPattern != dashPattern) {
      material.uniforms.dashPattern = dashPattern;
    }
  }

  polyline.width = width;

  if (polyline instanceof Cesium.Polyline) {
    // mark as updated so it isn't deleted
    polyline.dirty = false;
  }
};

/**
 * Creates or updates an individual polygon/linestring segment as a Cesium.Polyline.
 * @param {!number} i Index representing the ring within the polygon
 * @param {!Feature} feature
 * @param {!(LineString|Ellipse|MultiLineString|Polygon|MultiPolygon)} polygon
 * @param {!Style} style
 * @param {!VectorContext} context
 * @param {Array<number>} flatCoords
 * @param {number} offset Coordinate offset in the flat coordinates.
 * @param {number} end Coordinate end index in the flat coordinates.
 * @param {Array<!Cesium.Polyline>=} opt_primitives
 */
export const createOrUpdateSegment = (i, feature, polygon, style, context, flatCoords, offset, end, opt_primitives) => {
  let primitive;
  if (opt_primitives && i < opt_primitives.length) {
    primitive = opt_primitives[i];
  }

  if (!primitive) {
    primitive = createPolyline(feature, polygon, style, context, flatCoords, offset, end);

    if (primitive) {
      context.addPolyline(primitive, feature, polygon);
    }
  } else {
    updatePolyline(feature, polygon, style, context, primitive, flatCoords, offset, end);
  }
};
