goog.module('plugin.cesium.sync.IConverter');

const Feature = goog.requireType('ol.Feature');
const Geometry = goog.requireType('ol.geom.Geometry');
const Style = goog.requireType('ol.style.Style');
const VectorContext = goog.requireType('plugin.cesium.VectorContext');

/**
 * @interface
 */
class IConverter {
  /**
   * @param {!Feature} feature
   * @param {!Geometry} geometry
   * @param {!Style} style
   * @param {!VectorContext} context
   * @return {boolean}
   */
  create(feature, geometry, style, context) {}

  /**
   * @param {!Feature} feature
   * @param {!Geometry} geometry
   * @param {!Style} style
   * @param {!VectorContext} context
   * @return {!Array<!Cesium.PrimitiveLike>|!Cesium.PrimitiveLike|null|undefined}
   */
  retrieve(feature, geometry, style, context) {}

  /**
   * @param {!Feature} feature
   * @param {!Geometry} geometry
   * @param {!Style} style
   * @param {!VectorContext} context
   * @param {!Array<!Cesium.PrimitiveLike>|!Cesium.PrimitiveLike} primitive
   * @return {boolean}
   */
  update(feature, geometry, style, context, primitive) {}

  /**
   * @param {!Feature} feature
   * @param {!Geometry} geometry
   * @param {!Style} style
   * @param {!VectorContext} context
   * @param {!Array<!Cesium.PrimitiveLike>|!Cesium.PrimitiveLike} primitive
   * @return {boolean}
   */
  delete(feature, geometry, style, context, primitive) {}
}

exports = IConverter;
