goog.module('plugin.cesium.sync.PolygonConverter');

const {createPolygon} = goog.require('plugin.cesium.sync.polygon');
const {deletePrimitive, getPrimitive, updatePrimitive} = goog.require('plugin.cesium.primitive');
const {CreateFunction, UpdateFunction, Converter} = goog.requireType('plugin.cesium.sync.ConverterTypes');


/**
 * @type {CreateFunction}
 */
const create = (feature, geometry, style, context) => {
  const primitive = createPolygon(feature, geometry, style, context);
  context.addPrimitive(primitive, feature, geometry);
  return true;
};


/**
 * @type {UpdateFunction}
 */
const update = (feature, geometry, style, context, primitive) => {
  if (primitive.length) {
    let returnVal = true;

    primitive.dirty = false;
    for (let i = 0, n = primitive.length; i < n; i++) {
      returnVal &= update(feature, geometry, style, context, primitive.get(i));
    }

    return returnVal;
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
