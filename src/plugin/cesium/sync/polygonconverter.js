goog.module('plugin.cesium.sync.PolygonConverter');

const {createPolygon} = goog.require('plugin.cesium.sync.polygon');
const {deletePrimitive, getPrimitive} = goog.require('plugin.cesium.primitive');
const LineStringConverter = goog.require('plugin.cesium.sync.LineStringConverter');
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
    primitive.dirty = false;
    for (let i = 0, n = primitive.length; i < n; i++) {
      if (!update(feature, geometry, style, context, primitive.get(i))) {
        return false;
      }
    }
  }

  return LineStringConverter.update(feature, geometry, style, context, primitive);
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
