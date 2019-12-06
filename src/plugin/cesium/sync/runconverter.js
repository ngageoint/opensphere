goog.module('plugin.cesium.sync.runConverter');

const Feature = goog.requireType('ol.Feature');
const Geometry = goog.requireType('ol.geom.Geometry');
const Style = goog.requireType('ol.style.Style');
const VectorContext = goog.requireType('plugin.cesium.VectorContext');
const {Converter} = goog.requireType('plugin.cesium.sync.ConverterTypes');


/**
 * @param {!Converter} converter
 * @param {!Feature} feature
 * @param {!Geometry} geometry
 * @param {!Style} style
 * @param {!VectorContext} context
 */
const runConverter = (converter, feature, geometry, style, context) => {
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


exports = {
  runConverter
};
