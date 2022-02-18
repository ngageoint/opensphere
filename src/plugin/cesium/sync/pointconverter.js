goog.declareModuleId('plugin.cesium.sync.PointConverter');

import BaseConverter from './baseconverter.js';
import {createBillboard, updateBillboard, updateStyleAfterLoad} from './point.js';

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
