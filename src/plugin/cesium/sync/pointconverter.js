goog.module('plugin.cesium.sync.PointConverter');

const {createBillboard, updateBillboard} = goog.require('plugin.cesium.sync.point');
const BaseConverter = goog.require('plugin.cesium.sync.BaseConverter');

const MultiPoint = goog.requireType('ol.geom.MultiPoint');
const Point = goog.requireType('ol.geom.Point');


/**
 * Converter for Points
 */
class PointConverter extends BaseConverter {
  /**
   * @inheritDoc
   */
  create(feature, geometry, style, context) {
    const imageStyle = style.getImage();
    if (imageStyle) {
      const billboardOptions = createBillboard(feature, /** @type {!(Point)} */ (geometry), imageStyle, context);
      context.addBillboard(billboardOptions, feature, geometry);
      return true;
    }

    return false;
  }


  /**
   * @inheritDoc
   */
  update(feature, geometry, style, context, primitive) {
    const imageStyle = style.getImage();
    if (imageStyle) {
      updateBillboard(feature, /** @type {!(Point)} */ (geometry), imageStyle, context,
          /** @type {!Cesium.Billboard} */ (primitive));
      return true;
    }

    return false;
  }
}


exports = PointConverter;
