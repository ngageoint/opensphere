goog.module('plugin.cesium.sync.MultiLineStringConverter');

const BaseConverter = goog.require('plugin.cesium.sync.BaseConverter');
const {updatePrimitive} = goog.require('plugin.cesium.primitive');
const {createLineStringPrimitive, isLineWidthChanging, isDashChanging} = goog.require('plugin.cesium.sync.linestring');

const Feature = goog.requireType('ol.Feature');
const MultiLineString = goog.requireType('ol.geom.MultiLineString');
const Style = goog.requireType('ol.style.Style');
const VectorContext = goog.requireType('plugin.cesium.VectorContext');


/**
 * Converter for MultiLineStrings
 * @extends {BaseConverter<MultiLineString, Cesium.Primitive>}
 */
class MultiLineStringConverter extends BaseConverter {
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


exports = MultiLineStringConverter;
