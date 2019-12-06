goog.module('plugin.cesium.sync.polygon');

const olcsCore = goog.require('olcs.core');
const {GeometryInstanceId} = goog.require('plugin.cesium');
const getTransformFunction = goog.require('plugin.cesium.sync.getTransformFunction');
const {getColor, getLineWidthFromStyle} = goog.require('plugin.cesium.sync.style');
const {getDashPattern} = goog.require('plugin.cesium.sync.linestring');
const {getHeightReference} = goog.require('plugin.cesium.sync.HeightReference');
const {createColoredPrimitive, createGeometryInstance} = goog.require('plugin.cesium.primitive');

const Feature = goog.requireType('ol.Feature');
const Geometry = goog.requireType('ol.geom.Geometry');
const MultiPolygon = goog.requireType('ol.geom.MultiPolygon');
const Polygon = goog.requireType('ol.geom.Polygon');
const Style = goog.requireType('ol.style.Style');
const VectorContext = goog.requireType('plugin.cesium.VectorContext');


/**
 * @param {!Feature} feature Ol3 feature..
 * @param {!(Polygon|MultiPolygon)} geometry Ol3 polygon geometry.
 * @param {!Style} style
 * @param {!VectorContext} context
 * @param {Array<number>=} opt_polyFlats
 * @param {number=} opt_offset
 * @param {Array<number>=} opt_ringEnds
 * @param {boolean=} opt_extrude
 * @param {number=} opt_index
 * @return {Cesium.PrimitiveCollection|Cesium.Primitive}
 */
const createPolygon = (feature, geometry, style, context, opt_polyFlats, opt_offset, opt_ringEnds,
    opt_extrude, opt_index) => {
  // extruded polygons cannot be rendered as a polyline. since polygons will not respect line width on Windows, make
  // sure the geometry is both extruded and has an altitude before using the polygon primitive.
  const extrude = opt_extrude != undefined ? opt_extrude : !!geometry.get('extrude');
  if (extrude && os.geo.hasAltitudeGeometry(geometry)) {
    return createPolygonPrimitive(feature, geometry, style, context, opt_polyFlats, opt_offset, opt_ringEnds,
        opt_extrude, opt_index);
  }

  return createPolygonAsPolyline(feature, geometry, style, context, opt_polyFlats, opt_offset, opt_ringEnds,
      opt_extrude, opt_index);
};


/**
 * @param {!Feature} feature Ol3 feature..
 * @param {!(Polygon|MultiPolygon)} geometry Ol3 polygon geometry.
 * @param {!Style} style
 * @param {!VectorContext} context
 * @param {Array<number>=} opt_polyFlats
 * @param {number=} opt_offset
 * @param {Array<number>=} opt_ringEnds
 * @param {boolean=} opt_extrude
 * @param {number=} opt_index
 * @return {?(Cesium.PrimitiveCollection|Cesium.Primitive)}
 */
const createPolygonAsPolyline = (feature, geometry, style, context, opt_polyFlats, opt_offset, opt_ringEnds,
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

  const appearance = new Cesium.PolylineMaterialAppearance({
    material: Cesium.Material.fromType(Cesium.Material.PolylineDashType, {
      color: outlineColor,
      dashPattern: lineDash
    })
  });

  const primitives = new Cesium.PrimitiveCollection();

  // Cesium doesn't make line width accessible once the primitive is loaded to the GPU, so we need to save it. also
  // save if the outline needs to be displayed, so we know to recreate the primitive if that changes.
  primitives['olLineWidth'] = width;

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
    primitives.add(outlinePrimitive);
  }

  if (style.getFill()) {
    const fillGeometry = new Cesium.PolygonGeometry({
      polygonHierarchy: hierarchy,
      perPositionHeight: true
    });

    const fillColor = getColor(style, context, GeometryInstanceId.GEOM);
    const p = createColoredPrimitive(fillGeometry, fillColor, undefined, undefined,
        heightReference === Cesium.HeightReference.CLAMP_TO_GROUND ? Cesium.GroundPrimitive : Cesium.Primitive);
    // hide the primitive when alpha is 0 so it isn't picked
    p.show = fillColor.alpha > 0;
    primitives.add(p);
  }

  if (primitives.length == 1) {
    // if there is only 1 primative, set the outline properties on it and return it instead of the collection
    const result = /** @type {!Cesium.Primitive} */(primitives.get(0));
    result['olLineWidth'] = width;

    return result;
  } else {
    return primitives;
  }
};


/**
 * Convert an OpenLayers polygon geometry to Cesium, this method does NOT handle line width
 * in windows.
 *
 * @param {!Feature} feature Ol3 feature..
 * @param {!(Polygon|MultiPolygon)} geometry Ol3 polygon geometry.
 * @param {!Style} style
 * @param {!VectorContext} context
 * @param {Array<number>=} opt_polyFlats
 * @param {number=} opt_offset
 * @param {Array<number>=} opt_ringEnds
 * @param {boolean=} opt_extrude
 * @param {number=} opt_index
 * @return {?(Cesium.PrimitiveCollection|Cesium.Primitive)}
 */
const createPolygonPrimitive = (feature, geometry, style, context, opt_polyFlats, opt_offset, opt_ringEnds,
    opt_extrude, opt_index) => {
  let fillGeometry = null;
  let outlineGeometry = null;
  const extrude = opt_extrude !== undefined ? opt_extrude : !!geometry.get('extrude');
  const hierarchy = createPolygonHierarchy(geometry, opt_polyFlats, opt_offset, opt_ringEnds, opt_extrude);
  if (!hierarchy) {
    return null;
  }

  if (style.getFill()) {
    fillGeometry = new Cesium.PolygonGeometry({
      polygonHierarchy: hierarchy,
      perPositionHeight: true,
      extrudedHeight: extrude ? 0 : undefined
    });
  }

  outlineGeometry = new Cesium.PolygonOutlineGeometry({
    polygonHierarchy: hierarchy,
    perPositionHeight: true,
    extrudedHeight: extrude ? 0 : undefined
  });

  return wrapFillAndOutlineGeometries(feature, geometry, style, context, fillGeometry, outlineGeometry, opt_index);
};


/**
 * Create a primitive collection out of two Cesium geometries.
 * Only the OpenLayers style colors will be used.
 *
 * @param {!Feature} feature
 * @param {!Geometry} geometry
 * @param {!Style} style The style
 * @param {!VectorContext} context The vector context
 * @param {Cesium.Geometry} fill The fill geometry
 * @param {Cesium.Geometry} outline The outline geometry
 * @param {number=} opt_index
 * @return {!Cesium.PrimitiveCollection}
 * @protected
 */
const wrapFillAndOutlineGeometries = (feature, geometry, style, context, fill, outline, opt_index) => {
  const width = getLineWidthFromStyle(style);

  // Cesium doesn't make line width accessible once the primitive is loaded to the GPU, so we need to save it.
  const primitives = new Cesium.PrimitiveCollection();
  primitives['olLineWidth'] = width;

  const heightReference = getHeightReference(context.layer, feature, geometry);
  const primitiveType = heightReference === Cesium.HeightReference.CLAMP_TO_GROUND ?
    Cesium.GroundPrimitive : undefined;

  if (fill) {
    const fillColor = getColor(style, context, GeometryInstanceId.GEOM);

    // hide the primitive when alpha is 0 so it isn't picked
    const fillPrimitive = createColoredPrimitive(fill, fillColor, undefined, undefined, primitiveType);
    fillPrimitive.show = fillColor.alpha > 0;
    primitives.add(fillPrimitive);
  }

  if (outline) {
    // combine the layer/style opacity if there is a stroke style, otherwise set it to 0 to hide the outline
    const outlineColor = getColor(style, context, GeometryInstanceId.GEOM_OUTLINE);
    primitives.add(createColoredPrimitive(outline, outlineColor, width, undefined, primitiveType));
  }

  return primitives;
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

exports = {
  createPolygon
};
