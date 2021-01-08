goog.module('plugin.cesium.sync.DynamicPolygonConverter');

const BaseConverter = goog.require('plugin.cesium.sync.BaseConverter');
const getTransformFunction = goog.require('plugin.cesium.sync.getTransformFunction');
const olcsCore = goog.require('olcs.core');
const {GeometryInstanceId} = goog.require('plugin.cesium');
const {createColoredPrimitive, createGeometryInstance} = goog.require('plugin.cesium.primitive');
const {getColor, getLineWidthFromStyle} = goog.require('plugin.cesium.sync.style');
const {getDashPattern, getLineStringPositions} = goog.require('plugin.cesium.sync.linestring');
const {getHeightReference} = goog.require('plugin.cesium.sync.HeightReference');

const Polygon = goog.requireType('ol.geom.Polygon');
const Feature = goog.requireType('ol.Feature');
const Geometry = goog.requireType('ol.geom.Geometry');
const MultiPolygon = goog.requireType('ol.geom.MultiPolygon');
const Style = goog.requireType('ol.style.Style');
const VectorContext = goog.requireType('plugin.cesium.VectorContext');
const LineString = goog.requireType('ol.geom.LineString');
const MultiLineString = goog.requireType('ol.geom.MultiLineString');
const Ellipse = goog.requireType('os.geom.Ellipse');


/**
 * Converter for DynamicFeature polygons.
 * @extends {BaseConverter<(Polygon), (Cesium.Polyline|Cesium.PolylineOptions)>}
 */
class DynamicPolygonConverter extends BaseConverter {
  /**
   * @inheritDoc
   */
  create(feature, geometry, style, context) {
    const polylines = createPolygonAsPolyline(feature, geometry, style, context, []);
    polylines.forEach((polyline) => {
      context.addPrimitive(polyline, feature, geometry);
    });

    const polylineOptions = createPolyline(feature, geometry, style, context);
    context.addPolyline(polylineOptions, feature, geometry);
    return true;
  }

  /**
   * @inheritDoc
   */
  update(feature, geometry, style, context, primitive) {
    updatePolyline(feature, geometry, style, context, primitive);
    return true;
  }
}


/**
 * @param {!Feature} feature Ol3 feature..
 * @param {!(LineString|Ellipse|MultiLineString)} geometry Ol3 line string geometry.
 * @param {!Style} style
 * @param {!VectorContext} context
 * @param {Array<number>=} opt_flatCoords The flat coordinates from a multiline
 * @param {number=} opt_offset
 * @param {number=} opt_end
 * @return {!Cesium.PolylineOptions}
 */
const createPolyline = (feature, geometry, style, context, opt_flatCoords, opt_offset, opt_end) => {
  const polylineOptions = /** @type {Cesium.PolylineOptions} */ ({});
  updatePolyline(feature, geometry, style, context, polylineOptions, opt_flatCoords, opt_offset, opt_end);
  return polylineOptions;
};


/**
 * @param {!Feature} feature Ol3 feature..
 * @param {!(LineString|Ellipse|MultiLineString)} geometry Ol3 line string geometry.
 * @param {!Style} style
 * @param {!VectorContext} context
 * @param {!(Cesium.Polyline|Cesium.PolylineOptions)} polyline The polyline, for updates.
 * @param {Array<number>=} opt_flatCoords The flat coordinates from a multiline
 * @param {number=} opt_offset
 * @param {number=} opt_end
 */
const updatePolyline = (feature, geometry, style, context, polyline, opt_flatCoords, opt_offset, opt_end) => {
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
 * @param {!Feature} feature Ol3 feature..
 * @param {!(Polygon|MultiPolygon)} geometry Ol3 polygon geometry.
 * @param {!Style} style
 * @param {!VectorContext} context
 * @param {!Array<!Cesium.PrimitiveLike>} result
 * @param {Array<number>=} opt_polyFlats
 * @param {number=} opt_offset
 * @param {Array<number>=} opt_ringEnds
 * @param {boolean=} opt_extrude
 * @param {number=} opt_index
 * @return {Array<!Cesium.PrimitiveLike>|null}
 */
const createPolygonAsPolyline = (feature, geometry, style, context, result, opt_polyFlats, opt_offset, opt_ringEnds,
    opt_extrude, opt_index) => {
  const hierarchy = createPolygonHierarchy(geometry, opt_polyFlats, opt_offset, opt_ringEnds, opt_extrude);
  if (!hierarchy) {
    return null;
  }

  const csRings = [hierarchy.positions];
  if (hierarchy.holes) {
    hierarchy.holes.forEach(function(hole) {
      csRings.push(hole.positions);
    });
  }

  goog.asserts.assert(csRings.length > 0);

  const width = getLineWidthFromStyle(style);
  const lineDash = getDashPattern(style);
  const outlineColor = getColor(style, context, GeometryInstanceId.GEOM_OUTLINE);

  const appearance = lineDash ? new Cesium.PolylineMaterialAppearance({
    material: Cesium.Material.fromType(Cesium.Material.PolylineDashType, {
      color: outlineColor,
      dashPattern: lineDash
    })
  }) : new Cesium.PolylineColorAppearance();

  // Cesium doesn't make line width accessible once the primitive is loaded to the GPU, so we need to save it. also
  // save if the outline needs to be displayed, so we know to recreate the primitive if that changes.
  const heightReference = getHeightReference(context.layer, feature, geometry, opt_index);
  const primitiveType = heightReference === Cesium.HeightReference.CLAMP_TO_GROUND ? Cesium.GroundPolylinePrimitive :
    Cesium.Primitive;
  const geometryType = heightReference === Cesium.HeightReference.CLAMP_TO_GROUND ? Cesium.GroundPolylineGeometry :
    Cesium.PolylineGeometry;

  // always create outlines even if the style doesn't have a stroke. this allows updating the primitive if a stroke
  // is added without recreating it.
  for (let i = 0; i < csRings.length; ++i) {
    // Handle both color and width
    const polylineGeometry = new geometryType({
      positions: csRings[i],
      vertexFormat: appearance.vertexFormat,
      width: width
    });

    const instance = createGeometryInstance(GeometryInstanceId.GEOM_OUTLINE, polylineGeometry, outlineColor);
    const outlinePrimitive = new primitiveType({
      geometryInstances: instance,
      appearance: appearance
    });

    outlinePrimitive['olLineWidth'] = width;
    result.push(outlinePrimitive);
  }

  if (style.getFill()) {
    const fillColor = getColor(style, context, GeometryInstanceId.GEOM);

    if (fillColor.alpha > 0) {
      const fillGeometry = new Cesium.PolygonGeometry({
        polygonHierarchy: hierarchy,
        perPositionHeight: true
      });

      const p = createColoredPrimitive(fillGeometry, fillColor, undefined, undefined,
          heightReference === Cesium.HeightReference.CLAMP_TO_GROUND ? Cesium.GroundPrimitive : Cesium.Primitive);
      result.push(p);
    }
  }

  return result;
};


/**
 * @type {!ol.Coordinate}
 */
const scratchCoord1 = [];


/**
 * @type {!ol.Coordinate}
 */
const scratchCoord2 = [];


/**
 * @type {!ol.Extent}
 */
const scratchExtent1 = [Infinity, Infinity, -Infinity, -Infinity];


/**
 * Creates a Cesium.PolygonHierarchy from an ol.geom.Polygon.
 *
 * @param {!(Polygon|MultiPolygon)} geometry The OL polygon
 * @param {Array<number>=} opt_flats
 * @param {number=} opt_offset
 * @param {Array<number>=} opt_ringEnds
 * @param {boolean=} opt_extrude
 * @return {Cesium.PolygonHierarchy}
 */
const createPolygonHierarchy = (geometry, opt_flats, opt_offset, opt_ringEnds, opt_extrude) => {
  const transform = getTransformFunction();

  const flats = opt_flats || geometry.getFlatCoordinates();
  let offset = opt_offset || 0;
  const ends = opt_ringEnds || geometry.getEnds();
  // let extrude = opt_extrude != undefined ? opt_extrude : !!geometry.get('extrude');
  const stride = geometry.getStride();
  const coord = scratchCoord1;
  const transformedCoord = scratchCoord2;
  coord.length = stride;
  transformedCoord.length = stride;

  const extent = scratchExtent1;

  // reset extent
  extent[0] = Infinity;
  extent[1] = Infinity;
  extent[2] = -Infinity;
  extent[3] = -Infinity;

  let positions;
  let holes;

  for (let r = 0, rr = ends.length; r < rr; r++) {
    const end = ends[r];
    const csPos = new Array((end - offset) / stride);

    let count = 0;
    for (let i = offset; i < end; i += stride) {
      for (let j = 0; j < stride; j++) {
        coord[j] = flats[i + j];
        transformedCoord[j] = coord[j];
      }

      if (transform) {
        transform(coord, transformedCoord, coord.length);
      }

      csPos[count] = olcsCore.ol4326CoordinateToCesiumCartesian(transformedCoord);
      count++;
    }

    // if a ring is empty, just ignore it
    if (csPos && csPos.length) {
      if (r == 0) {
        positions = csPos;
      } else {
        holes = holes || [];
        holes.push(new Cesium.PolygonHierarchy(csPos));
      }
    }

    offset = end;
  }

  // don't create a polygon if we don't have an outer ring
  return positions ? new Cesium.PolygonHierarchy(positions, holes) : null;
};

exports = DynamicPolygonConverter;
