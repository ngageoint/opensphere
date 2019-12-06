goog.module('plugin.cesium.primitive');

const Delay = goog.require('goog.async.Delay');
const {GeometryInstanceId} = goog.require('plugin.cesium');
const {unsafeClone} = goog.require('os.object');
const {getHeightReference, isPrimitiveClassTypeChanging} = goog.require('plugin.cesium.sync.HeightReference');
const styleUtils = goog.require('plugin.cesium.sync.style');

const Feature = goog.requireType('ol.Feature');
const Geometry = goog.requireType('ol.geom.Geometry');
const Style = goog.requireType('ol.style.Style');
const {RetrieveFunction, UpdateFunction} = goog.requireType('plugin.cesium.sync.ConverterTypes');
const VectorContext = goog.requireType('plugin.cesium.VectorContext');

/**
 * @type {RetrieveFunction}
 */
const getPrimitive = (feature, geometry, style, context) => {
  return context.getPrimitiveForGeometry(geometry);
};


/**
 * @type {UpdateFunction}
 */
const shouldUpdatePrimitive = (feature, geometry, style, context, primitive) => {
  const heightReference = getHeightReference(context.layer, feature, geometry);
  return !isPrimitiveClassTypeChanging(heightReference, primitive);
};


/**
 * @type {UpdateFunction}
 */
const updatePrimitive = (feature, geometry, style, context, primitive) => {
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
        const color = styleUtils.getColor(style, context, field);

        if (color) {
          primitive.show = color.alpha > 0;

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
 * @type {UpdateFunction}
 */
const deletePrimitive = (feature, geometry, style, context, primitive) => {
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
const createColoredPrimitive = (geometry, color, opt_lineWidth, opt_instanceFn, opt_primitiveType, opt_modelMatrix) => {
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
const createGeometryInstance = (id, geometry, color, opt_modelMatrix) => {
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
const updateLineWidth = (options, lineWidth) => {
  options.renderState.lineWidth = goog.math.clamp(lineWidth, Cesium.ContextLimits.minimumAliasedLineWidth,
      Cesium.ContextLimits.maximumAliasedLineWidth);
};


/**
 * Base Cesium primitive render options.
 * @type {!Object}
 * @const
 */
const BASE_PRIMITIVE_OPTIONS = {
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
const isGroundPrimitive = function(primitive) {
  if (primitive) {
    if (primitive instanceof Cesium.GroundPrimitive || primitive instanceof Cesium.GroundPolylinePrimitive) {
      return true;
    } else if (primitive.length) {
      for (let i = 0, n = primitive.length; i < n; i++) {
        if (isGroundPrimitive(primitive.get(i))) {
          return true;
        }
      }
    }
  }

  return false;
};


/**
 * @param {Cesium.PrimitiveLike} primitive The primitive
 * @return {!boolean}
 */
const isPrimitiveShown = function(primitive) {
  // This function would not be necessary if some of the *Collection implementations
  // didn't somehow miss implementing the "show" member of the primitive "interface".
  if (primitive.show === undefined) {
    return primitive.length > 0 ? isPrimitiveShown(primitive.get(0)) : true;
  }

  return !!primitive.show;
};


/**
 * @param {?Cesium.PrimitiveLike} primitive The primitive
 * @param {boolean} show Whether or not to show the primitive
 */
const setPrimitiveShown = function(primitive, show) {
  if (primitive) {
    // This function would not be necessary if some of the *Collection implementations
    // didn't somehow miss implementing the "show" member of the primitive "interface".
    if (primitive.show === undefined) {
      for (let i = 0, n = primitive.length; i < n; i++) {
        setPrimitiveShown(primitive.get(i), show);
      }
    } else {
      primitive.show = show;
    }
  }
};

exports = {
  BASE_PRIMITIVE_OPTIONS,
  createColoredPrimitive,
  createGeometryInstance,
  deletePrimitive,
  getPrimitive,
  isGroundPrimitive,
  isPrimitiveShown,
  setPrimitiveShown,
  shouldUpdatePrimitive,
  updateLineWidth,
  updatePrimitive
};
