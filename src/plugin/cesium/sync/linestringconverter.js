goog.module('plugin.cesium.sync.LineStringConverter');

const {updatePrimitive} = goog.require('plugin.cesium.primitive');
const BaseConverter = goog.require('plugin.cesium.sync.BaseConverter');
const {createLineStringPrimitive, isLineWidthChanging, isDashChanging} = goog.require('plugin.cesium.sync.linestring');

const LineString = goog.requireType('ol.geom.LineString');

/**
 * Converter for LineStrings
 * @extends {BaseConverter<LineString, Cesium.Primitive>}
 */
class LineStringConverter extends BaseConverter {
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


exports = LineStringConverter;
