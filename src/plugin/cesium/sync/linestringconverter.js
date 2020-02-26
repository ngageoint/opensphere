goog.module('plugin.cesium.sync.LineStringConverter');

const BaseConverter = goog.require('plugin.cesium.sync.BaseConverter');
const {updatePrimitive} = goog.require('plugin.cesium.primitive');
const {createLineStringPrimitive, isGeometryDirty, isLineWidthChanging, isDashChanging} =
  goog.require('plugin.cesium.sync.linestring');

/**
 * Converter for LineStrings
 */
class LineStringConverter extends BaseConverter {
  /**
   * @inheritDoc
   */
  create(feature, geometry, style, context) {
    const line = createLineStringPrimitive(feature, geometry, style, context);
    context.addPrimitive(line, feature, geometry);
    return true;
  }

  /**
   * @inheritDoc
   */
  update(feature, geometry, style, context, primitive) {
    if (isGeometryDirty(geometry) ||
        isLineWidthChanging(primitive, style) ||
        isDashChanging(primitive, style)) {
      return false;
    }

    return updatePrimitive(feature, geometry, style, context, primitive);
  }
}


exports = LineStringConverter;
