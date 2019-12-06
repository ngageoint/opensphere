goog.module('plugin.cesium.sync.PointConverter');

const {getPrimitive, deletePrimitive} = goog.require('plugin.cesium.primitive');
const {createBillboard, updateBillboard} = goog.require('plugin.cesium.sync.point');
const {CreateFunction, UpdateFunction, Converter} = goog.requireType('plugin.cesium.sync.ConverterTypes');

const MultiPoint = goog.requireType('ol.geom.MultiPoint');
const Point = goog.requireType('ol.geom.Point');


/**
 * @type {CreateFunction}
 */
const create = (feature, geometry, style, context) => {
  const imageStyle = style.getImage();
  if (imageStyle) {
    const billboardOptions = createBillboard(feature, /** @type {!(Point)} */ (geometry), imageStyle, context);
    context.addBillboard(billboardOptions, feature, geometry);
    return true;
  }

  return false;
};


/**
 * @type {UpdateFunction}
 */
const update = (feature, geometry, style, context, primitive) => {
  const imageStyle = style.getImage();
  if (imageStyle) {
    updateBillboard(feature, /** @type {!(Point)} */ (geometry), imageStyle, context,
        /** @type {!Cesium.Billboard} */ (primitive));
    return true;
  }

  return false;
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
