goog.module('plugin.cesium.sync.MultiPointConverter');

const {deletePrimitive, getPrimitive} = goog.require('plugin.cesium.primitive');
const {createBillboard, updateBillboard} = goog.require('plugin.cesium.sync.point');

const Feature = goog.requireType('ol.Feature');
const MultiPoint = goog.requireType('ol.geom.MultiPoint');
const ImageStyle = goog.requireType('ol.style.Image');
const VectorContext = goog.requireType('plugin.cesium.VectorContext');
const {CreateFunction, UpdateFunction, Converter} = goog.requireType('plugin.cesium.sync.ConverterTypes');


/**
 * @type {CreateFunction}
 */
const create = (feature, geometry, style, context) => {
  const imageStyle = style.getImage();
  if (imageStyle) {
    const primitives = new Cesium.BillboardCollection({
      scene: context.scene
    });

    updateMultiPoint(feature, geometry, imageStyle, context, primitives);

    if (primitives.length) {
      context.addPrimitive(primitives, feature, geometry);
      return true;
    }
  }

  return false;
};


/**
 * @type {UpdateFunction}
 * @suppress {accessControls}
 */
const update = (feature, geometry, style, context, primitive) => {
  const imageStyle = style.getImage();
  if (imageStyle) {
    updateMultiPoint(feature, geometry, imageStyle, context, primitive);
    primitive.dirty = false;
    return true;
  }

  return false;
};


/**
 * @param {!Feature} feature
 * @param {!MultiPoint} geometry
 * @param {!ImageStyle} imageStyle
 * @param {!VectorContext} context
 * @param {!Cesium.BillboardCollection} primitive
 * @suppress {accessControls}
 */
const updateMultiPoint = (feature, geometry, imageStyle, context, primitive) => {
  const pointFlats = geometry.getFlatCoordinates();
  const stride = geometry.stride;

  let count = 0;

  for (let i = 0, ii = pointFlats.length; i < ii; i += stride) {
    const bb = count < primitive.length ? primitive.get(count) : undefined;

    if (bb) {
      updateBillboard(feature, geometry, imageStyle, context, bb, pointFlats, i, count);
    } else {
      const options = createBillboard(feature, geometry, imageStyle, context, pointFlats, i, count);
      primitive.add(options);
    }

    count++;
  }
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
