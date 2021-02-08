goog.declareModuleId('plugin.cesium.sync.IConverterTemp');

const Feature = goog.requireType('ol.Feature');
const Style = goog.requireType('ol.style.Style');
const VectorContext = goog.requireType('plugin.cesium.VectorContext');


/**
 * @interface
 * @template GEOMETRY,PRIMITIVE
 */
class IConverter {
  /**
   * @param {!Feature} feature
   * @param {!GEOMETRY} geometry
   * @param {!Style} style
   * @param {!VectorContext} context
   * @return {boolean}
   */
  create(feature, geometry, style, context) {}

  /**
   * @param {!Feature} feature
   * @param {!GEOMETRY} geometry
   * @param {!Style} style
   * @param {!VectorContext} context
   * @return {PRIMITIVE|null|undefined}
   */
  retrieve(feature, geometry, style, context) {}

  /**
   * @param {!Feature} feature
   * @param {!GEOMETRY} geometry
   * @param {!Style} style
   * @param {!VectorContext} context
   * @param {PRIMITIVE} primitive
   * @return {boolean}
   */
  update(feature, geometry, style, context, primitive) {}

  /**
   * @param {!Feature} feature
   * @param {!GEOMETRY} geometry
   * @param {!Style} style
   * @param {!VectorContext} context
   * @param {PRIMITIVE} primitive
   * @return {boolean}
   */
  delete(feature, geometry, style, context, primitive) {}
}

export default IConverter;
