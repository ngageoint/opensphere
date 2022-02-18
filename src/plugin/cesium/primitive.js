goog.declareModuleId('plugin.cesium.primitive');

import {unsafeClone} from '../../os/object/object.js';
import {GeometryInstanceId} from './cesium.js';
import {getHeightReference, isPrimitiveClassTypeChanging} from './sync/heightreference.js';
import {getColor} from './sync/style.js';

const Delay = goog.require('goog.async.Delay');
const {clamp} = goog.require('goog.math');


/**
 * @param {!Feature} feature
 * @param {!Geometry} geometry
 * @param {!Style} style
 * @param {!VectorContext} context
 * @return {!Array<!Cesium.PrimitiveLike>|!Cesium.PrimitiveLike|null|undefined}
 */
export const getPrimitive = (feature, geometry, style, context) => {
  return context.getPrimitiveForGeometry(geometry);
};

/**
 * @param {!Feature} feature
 * @param {!Geometry} geometry
 * @param {!Style} style
 * @param {!VectorContext} context
 * @param {!Cesium.PrimitiveLike} primitive
 * @return {boolean}
 */
export const shouldUpdatePrimitive = (feature, geometry, style, context, primitive) => {
  const heightReference = getHeightReference(context.layer, feature, geometry);
  return !isPrimitiveClassTypeChanging(heightReference, primitive);
};

/**
 * @param {!Feature} feature
 * @param {!Geometry} geometry
 * @param {!Style} style
 * @param {!VectorContext} context
 * @param {!Cesium.PrimitiveLike} primitive
 * @return {boolean}
 */
export const updatePrimitive = (feature, geometry, style, context, primitive) => {
  if (!shouldUpdatePrimitive(feature, geometry, style, context, primitive)) {
    return false;
  }

  primitive.dirty = true;

  if (!primitive.ready) {
    retryUpdateLater(feature, geometry, style, context, primitive);
    primitive.dirty = false;
  } else if (!primitive.isDestroyed() && !feature.isDisposed()) {
    updatePrimitiveGeomInstances(style, context, primitive);
    primitive.dirty = false;
  }

  return true;
};


/**
 * @param {!Feature} feature
 * @param {!Geometry} geometry
 * @param {!Style} style
 * @param {!VectorContext} context
 * @param {!Cesium.PrimitiveLike} primitive
 */
const retryUpdateLater = (feature, geometry, style, context, primitive) => {
  // primitives won't be marked as ready until they've been loaded to the GPU. we can't update them until they're
  // ready, so call this again on a delay. limit to 20 tries in case a primitive is never ready for whatever
  // reason.
  primitive.updateRetries = primitive.updateRetries !== undefined ? primitive.updateRetries + 1 : 1;

  if (primitive.updateRetries < 20) {
    const callback = goog.partial(updatePrimitive, feature, geometry, style, context, primitive);
    const delay = new Delay(callback, 100);
    delay.start();
  }
};


/**
 * @param {!Style} style
 * @param {!VectorContext} context
 * @param {!Cesium.PrimitiveLike} primitive
 */
const updatePrimitiveGeomInstances = (style, context, primitive) => {
  primitive.updateRetries = 0;

  for (const key in GeometryInstanceId) {
    // the try-catch is for the lovely DevErrors in Unminified Cesium
    try {
      const field = GeometryInstanceId[key];
      const attributes = primitive.getGeometryInstanceAttributes(field);
      const material = primitive.appearance.material;
      if (attributes) {
        const color = getColor(style, context, field);

        if (color) {
          if (material && material.uniforms) {
            material.uniforms.color = color;
          } else {
            attributes.color = Cesium.ColorGeometryInstanceAttribute.toValue(color, attributes.color);
          }
        }
      }
    } catch (e) {
    }
  }
};


/**
 * @param {!Feature} feature
 * @param {!Geometry} geometry
 * @param {!Style} style
 * @param {!VectorContext} context
 * @param {!Array<!Cesium.PrimitiveLike>|!Cesium.PrimitiveLike} primitive
 * @return {boolean}
 */
export const deletePrimitive = (feature, geometry, style, context, primitive) => {
  if (Array.isArray(primitive)) {
    for (let i = 0, n = primitive.length; i < n; i++) {
      deletePrimitive(feature, geometry, style, context, primitive[i]);
    }
    return true;
  }

  context.removePrimitive(primitive);
  return true;
};

/**
 * Basics primitive creation using a color attribute.
 * Note that Cesium has 'interior' and outline geometries.
 *
 * @param {!Cesium.Geometry} geometry The geometry.
 * @param {!Cesium.Color} color The primitive color.
 * @param {number=} opt_lineWidth The line width.
 * @param {Function=} opt_instanceFn The geometry instance function.
 * @param {Function=} opt_primitiveType
 * @param {!Cesium.Matrix4=} opt_modelMatrix
 * @return {!Cesium.Primitive}
 */
export const createColoredPrimitive = (geometry, color, opt_lineWidth, opt_instanceFn, opt_primitiveType,
    opt_modelMatrix) => {
  const options = unsafeClone(BASE_PRIMITIVE_OPTIONS);
  if (opt_lineWidth != null) {
    updateLineWidth(options, opt_lineWidth);
  }

  const id = opt_lineWidth != null ? GeometryInstanceId.GEOM_OUTLINE : GeometryInstanceId.GEOM;
  const instances = opt_instanceFn ? opt_instanceFn(id, geometry, color, opt_modelMatrix) :
    createGeometryInstance(id, geometry, color, opt_modelMatrix);
  const appearance = new Cesium.PerInstanceColorAppearance(options);
  opt_primitiveType = opt_primitiveType || Cesium.Primitive;
  const primitive = new opt_primitiveType({
    geometryInstances: instances,
    appearance: appearance
  });

  return primitive;
};

/**
 * Create a Cesium geometry instance
 *
 * @param {GeometryInstanceId} id The instance identifier
 * @param {!Cesium.Geometry} geometry The geometry
 * @param {!Cesium.Color} color The color
 * @param {!Cesium.Matrix4=} opt_modelMatrix
 * @return {!Cesium.GeometryInstance}
 */
export const createGeometryInstance = (id, geometry, color, opt_modelMatrix) => {
  return new Cesium.GeometryInstance({
    id,
    geometry,
    modelMatrix: opt_modelMatrix,
    attributes: {
      color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
    }
  });
};

/**
 * @param {!Object} options
 * @param {number} lineWidth
 */
export const updateLineWidth = (options, lineWidth) => {
  options.renderState.lineWidth = clamp(lineWidth, Cesium.ContextLimits.minimumAliasedLineWidth,
      Cesium.ContextLimits.maximumAliasedLineWidth);
};

/**
 * Base Cesium primitive render options.
 * @type {!Object}
 * @const
 */
export const BASE_PRIMITIVE_OPTIONS = {
  flat: true,
  renderState: {
    depthTest: {
      enabled: true
    }
  }
};

/**
 * @param {!Cesium.PrimitiveLike} primitive
 * @return {boolean}
 */
export const isGroundPrimitive = function(primitive) {
  if (primitive) {
    return primitive instanceof Cesium.GroundPrimitive || primitive instanceof Cesium.GroundPolylinePrimitive;
  }

  return false;
};

/**
 * @param {?(Array<Cesium.PrimitiveLike>|Cesium.PrimitiveLike|Cesium.CollectionLike)} primitive The primitive
 * @return {!boolean}
 */
export const isPrimitiveShown = function(primitive) {
  if (Array.isArray(primitive)) {
    return primitive.length > 0 ? isPrimitiveShown(primitive[0]) : true;
  } else if (primitive.show != null) {
    return primitive.show;
  }

  return false;
};

/**
 * @param {?(Array<Cesium.PrimitiveLike>|Cesium.PrimitiveLike|Cesium.CollectionLike)} primitive The primitive
 * @param {boolean} show Whether or not to show the primitive
 */
export const setPrimitiveShown = function(primitive, show) {
  if (primitive) {
    if (Array.isArray(primitive)) {
      for (let i = 0, n = primitive.length; i < n; i++) {
        setPrimitiveShown(primitive[i], show);
      }
    } else if (primitive.show != null) {
      primitive.show = show;
    }
  }
};
