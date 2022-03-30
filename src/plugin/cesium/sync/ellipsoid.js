goog.declareModuleId('plugin.cesium.sync.ellipsoid');

import olcsCore from 'ol-cesium/src/olcs/core.js';

import {GeometryInstanceId} from '../cesium.js';
import {createColoredPrimitive} from '../primitive.js';
import {getColor} from './style.js';


/**
 * Convert an OpenLayers polygon geometry to Cesium.
 *
 * @param {!Feature} feature Ol3 feature..
 * @param {!Ellipse} geometry Ellipse geometry.
 * @param {!Style} style
 * @param {!VectorContext} context
 */
export const createEllipsoid = (feature, geometry, style, context) => {
  const olCenter = geometry.getCenter();
  const center = olcsCore.ol4326CoordinateToCesiumCartesian(olCenter);

  const semiMajor = geometry.getSemiMajor();
  const semiMinor = geometry.getSemiMinor();
  const rotation = Cesium.Math.toRadians(90 + geometry.getOrientation());

  const radii = new Cesium.Cartesian3(semiMajor, semiMinor, semiMinor);
  const headingPitchRoll = new Cesium.HeadingPitchRoll(rotation, 0, 0);
  const modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(center, headingPitchRoll, Cesium.Ellipsoid.WGS84,
      undefined, new Cesium.Matrix4());

  const fillGeometry = new Cesium.EllipsoidGeometry({
    radii: radii
  });

  const outlineGeometry = new Cesium.EllipsoidOutlineGeometry({
    radii: radii,
    stackPartitions: 2,
    slicePartitions: 4
  });

  addFillAndOutline(feature, geometry, style, context, fillGeometry, outlineGeometry, modelMatrix);
};


/**
 * Create a primitive collection out of two Cesium ellipsoid geometries.
 * Only the OpenLayers style colors will be used.
 *
 * @param {!Feature} feature
 * @param {!Ellipse} geometry
 * @param {!Style} style The style
 * @param {!VectorContext} context The vector context
 * @param {!Cesium.Geometry} fill The fill geometry
 * @param {!Cesium.Geometry} outline The outline geometry
 * @param {!Cesium.Matrix4} modelMatrix
 */
const addFillAndOutline = function(feature, geometry, style, context, fill, outline, modelMatrix) {
  const fillColor = new Cesium.Color(1, 1, 1, context.layer.getOpacity() * 0.3);
  const outlineColor = getColor(style, context, GeometryInstanceId.GEOM_OUTLINE);
  outlineColor.alpha *= 0.75;

  // wireframe width is fixed to give 3D context without being invasive
  const wireWidth = 1;

  context.addPrimitive(
      createColoredPrimitive(fill, fillColor, undefined, createEllipsoidInstance, undefined, modelMatrix),
      feature, geometry);

  context.addPrimitive(
      createColoredPrimitive(outline, outlineColor, wireWidth, createEllipsoidInstance, undefined, modelMatrix),
      feature, geometry);
};



/**
 * @param {GeometryInstanceId} id
 * @param {!Cesium.Geometry} geometry
 * @param {!Cesium.Color} color
 * @param {!Cesium.Matrix4=} opt_modelMatrix
 * @return {!Cesium.GeometryInstance}
 */
const createEllipsoidInstance = (id, geometry, color, opt_modelMatrix) => {
  if (id === GeometryInstanceId.GEOM) {
    id = GeometryInstanceId.ELLIPSOID;
  } else {
    id = GeometryInstanceId.ELLIPSOID_OUTLINE;
  }

  return new Cesium.GeometryInstance({
    id,
    geometry,
    modelMatrix: opt_modelMatrix,
    attributes: {
      color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
    }
  });
};
