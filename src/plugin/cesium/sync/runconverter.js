goog.declareModuleId('plugin.cesium.sync.runConverter');


/**
 * @param {!IConverter} converter
 * @param {!Feature} feature
 * @param {!Geometry} geometry
 * @param {!Style} style
 * @param {!VectorContext} context
 */
export const runConverter = (converter, feature, geometry, style, context) => {
  const primitive = converter.retrieve(feature, geometry, style, context);
  if (primitive) {
    const updateSuccessful = converter.update(feature, geometry, style, context, primitive);
    if (updateSuccessful) {
      return;
    }

    converter.delete(feature, geometry, style, context, primitive);
  }

  converter.create(feature, geometry, style, context);
};
