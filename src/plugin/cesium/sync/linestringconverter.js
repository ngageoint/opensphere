goog.declareModuleId('plugin.cesium.sync.LineStringConverter');

import {updatePrimitive} from '../primitive.js';
import BaseConverter from './baseconverter.js';
import {createLineStringPrimitive, isDashChanging, isLineWidthChanging} from './linestring.js';

/**
 * Converter for LineStrings
 * @extends {BaseConverter<LineString, Cesium.Primitive>}
 */
export default class LineStringConverter extends BaseConverter {
  /**
   * @inheritDoc
   */
  create(feature, geometry, style, context) {
    const line = createLineStringPrimitive(feature, geometry, style, context);
    if (line) {
      context.addPrimitive(line, feature, geometry);
      return true;
    }
    return false;
  }

  /**
   * @inheritDoc
   */
  update(feature, geometry, style, context, primitive) {
    if (isLineWidthChanging(primitive, style) || isDashChanging(primitive, style)) {
      return false;
    }

    return updatePrimitive(feature, geometry, style, context, primitive);
  }
}
