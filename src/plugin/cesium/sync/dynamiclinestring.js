goog.module('plugin.cesium.sync.DynamicLineString');

const {getColor, getLineWidthFromStyle} = goog.require('plugin.cesium.sync.style');
const {getDashPattern, getLineStringPositions} = goog.require('plugin.cesium.sync.linestring');

const Feature = goog.requireType('ol.Feature');
const {GeometryInstanceId} = goog.require('plugin.cesium');

const LineString = goog.requireType('ol.geom.LineString');
const MultiLineString = goog.requireType('ol.geom.MultiLineString');
const Ellipse = goog.requireType('os.geom.Ellipse');
const Style = goog.requireType('ol.style.Style');
const VectorContext = goog.requireType('plugin.cesium.VectorContext');


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


exports = {
  createPolyline,
  updatePolyline
};
