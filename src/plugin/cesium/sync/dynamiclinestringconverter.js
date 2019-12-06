goog.module('plugin.cesium.sync.DynamicLineStringConverter');

const {deletePrimitive, getPrimitive, shouldUpdatePrimitive} = goog.require('plugin.cesium.primitive');
const {createPolyline, updatePolyline} = goog.require('plugin.cesium.sync.DynamicLineString');

const {CreateFunction, UpdateFunction, Converter} = goog.requireType('plugin.cesium.sync.ConverterTypes');

/**
 * @type {CreateFunction}
 */
const create = (feature, geometry, style, context) => {
  const polylineOptions = createPolyline(feature, geometry, style, context);
  context.addPolyline(polylineOptions, feature, geometry);
  return true;
};


/**
 * @type {UpdateFunction}
 */
const update = (feature, geometry, style, context, primitive) => {
  if (!shouldUpdatePrimitive(feature, geometry, style, context, primitive)) {
    return false;
  }

  updatePolyline(feature, geometry, style, context, primitive);
  return true;
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
