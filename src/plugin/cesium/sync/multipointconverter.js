goog.declareModuleId('plugin.cesium.sync.MultiPointConverter');

import BaseConverter from './baseconverter.js';
import {createBillboard, updateBillboard, updateStyleAfterLoad} from './point.js';


/**
 * Converter for MultiPoints
 * @extends {BaseConverter<MultiPoint, Array<!Cesium.Billboard>>}
 */
export default class MultiPointConverter extends BaseConverter {
  /**
   * @inheritDoc
   */
  create(feature, geometry, style, context) {
    const imageStyle = style.getImage();
    if (imageStyle) {
      updateMultiPoint(feature, geometry, imageStyle, context);
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
      updateMultiPoint(feature, geometry, imageStyle, context, primitive);
      primitive.dirty = false;
      return true;
    }

    return false;
  }
}


/**
 * @param {!Feature} feature
 * @param {!MultiPoint} geometry
 * @param {!ImageStyle} imageStyle
 * @param {!VectorContext} context
 * @param {!Array<!Cesium.Billboard>=} opt_primitive
 * @suppress {accessControls}
 */
const updateMultiPoint = (feature, geometry, imageStyle, context, opt_primitive) => {
  const pointFlats = geometry.getFlatCoordinates();
  const stride = geometry.stride;

  let count = 0;

  for (let i = 0, ii = pointFlats.length; i < ii; i += stride) {
    let bb = opt_primitive && count < opt_primitive.length ? opt_primitive[count] : undefined;

    if (bb) {
      updateBillboard(feature, geometry, imageStyle, context, bb, pointFlats, i, count);
    } else {
      const options = createBillboard(feature, geometry, imageStyle, context, pointFlats, i, count);
      bb = context.addBillboard(options, feature, geometry);
    }

    if (bb) {
      updateStyleAfterLoad(bb, imageStyle);
    }

    count++;
  }
};
