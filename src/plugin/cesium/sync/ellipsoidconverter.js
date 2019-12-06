goog.module('plugin.cesium.sync.EllipsoidConverter');

const {createEllipsoid} = goog.require('plugin.cesium.sync.ellipsoid');
const PolygonConverter = goog.require('plugin.cesium.sync.PolygonConverter');

const {CreateFunction, Converter} = goog.requireType('plugin.cesium.sync.ConverterTypes');


/**
 * @type {CreateFunction}
 */
const create = (feature, geometry, style, context) => {
  const primitive = createEllipsoid(feature, geometry, style, context);
  context.addPrimitive(primitive, feature, geometry);
  return true;
};


/**
 * @type {Converter}
 */
exports = {
  create,
  retrieve: PolygonConverter.retrieve,
  update: PolygonConverter.update,
  delete: PolygonConverter.delete
};

