goog.declareModuleId('plugin.cesium.sync.MultiLineStringConverter');

import {updatePrimitive} from '../primitive.js';
import BaseConverter from './baseconverter.js';
import {createLineStringPrimitive, isDashChanging, isLineWidthChanging} from './linestring.js';


/**
 * Converter for MultiLineStrings
 * @extends {BaseConverter<MultiLineString, Cesium.Primitive>}
 */
export default class MultiLineStringConverter extends BaseConverter {
  /**
   * @inheritDoc
   */
  create(feature, geometry, style, context) {
    createMultiLineString(feature, geometry, style, context);
    return true;
  }

  /**
   * @inheritDoc
   */
  update(feature, geometry, style, context, primitive) {
    if (isLineWidthChanging(primitive, style) || isDashChanging(primitive, style)) {
      return false;
    }

    if (!Array.isArray(primitive)) {
      // TODO: log error
      return false;
    }

    for (let i = 0, n = primitive.length; i < n; i++) {
      if (!updatePrimitive(feature, geometry, style, context, primitive[i])) {
        return false;
      }
    }

    primitive.dirty = false;
    return true;
  }
}



/**
 * @param {!Feature} feature
 * @param {!MultiLineString} multiLine
 * @param {!Style} style
 * @param {!VectorContext} context
 */
const createMultiLineString = (feature, multiLine, style, context) => {
  const lineFlats = multiLine.getFlatCoordinates();
  const lineEnds = multiLine.getEnds();

  let offset = 0;

  for (let i = 0, ii = lineEnds.length; i < ii; i++) {
    const lineEnd = lineEnds[i];
    const line = createLineStringPrimitive(feature, multiLine, style, context, lineFlats, offset, lineEnd, i);

    if (line) {
      context.addPrimitive(line, feature, multiLine);
    }

    offset = lineEnd;
  }
};
