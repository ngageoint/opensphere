goog.module('plugin.cesium.sync.LineStringConverter');


const {getPrimitive, updatePrimitive, deletePrimitive} = goog.require('plugin.cesium.primitive');
const {createLineStringPrimitive, isGeometryDirty, isLineWidthChanging, isDashChanging} =
  goog.require('plugin.cesium.sync.linestring');
const {CreateFunction, UpdateFunction, Converter} = goog.requireType('plugin.cesium.sync.ConverterTypes');


/**
 * @type {CreateFunction}
 */
const create = (feature, geometry, style, context) => {
  const line = createLineStringPrimitive(feature, geometry, style, context);
  context.addPrimitive(line, feature, geometry);
  return true;
};


/**
 * @type {UpdateFunction}
 */
const update = (feature, geometry, style, context, primitive) => {
  if (isGeometryDirty(geometry) ||
      isLineWidthChanging(primitive, style) ||
      isDashChanging(primitive, style)) {
    return false;
  }

  return updatePrimitive(feature, geometry, style, context, primitive);
};


/**
 * @type {Converter}
 */
exports = {
  create,
  retrieve: getPrimitive,
  update,
  delete: deletePrimitive
};
