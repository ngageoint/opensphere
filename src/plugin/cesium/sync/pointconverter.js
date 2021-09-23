goog.declareModuleId('plugin.cesium.sync.PointConverter');

const BaseConverter = goog.require('plugin.cesium.sync.BaseConverter');
const {createBillboard, updateBillboard, updateStyleAfterLoad} = goog.require('plugin.cesium.sync.point');

const Point = goog.requireType('ol.geom.Point');


/**
 * Converter for Points
 * @extends {BaseConverter<Point, Cesium.Billboard>}
 */
export default class PointConverter extends BaseConverter {
  /**
   * @inheritDoc
   */
  create(feature, geometry, style, context) {
    const imageStyle = style.getImage();
    if (imageStyle) {
      const billboardOptions = createBillboard(feature, geometry, imageStyle, context);
      const billboard = context.addBillboard(billboardOptions, feature, geometry);
      if (billboard) {
        updateStyleAfterLoad(billboard, imageStyle);
      }

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
      const billboard = /** @type {!Cesium.Billboard} */ (primitive);
      updateBillboard(feature, geometry, imageStyle, context, billboard);
      updateStyleAfterLoad(billboard, imageStyle);
      return true;
    }

    return false;
  }
}
