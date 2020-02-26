goog.module('plugin.cesium.sync.GeometryCollectionConverter');

const BaseConverter = goog.require('plugin.cesium.sync.BaseConverter');

const Feature = goog.requireType('ol.Feature');
const Geometry = goog.requireType('ol.geom.Geometry');
const GeometryCollection = goog.requireType('ol.geom.GeometryCollection');
const Style = goog.requireType('ol.style.Style');
const VectorContext = goog.requireType('plugin.cesium.VectorContext');


/**
 * @typedef {undefined|function(!Feature, !Geometry, !Style, !VectorContext):undefined}
 */
/* exported ConvertFunctionType */
let ConvertFunctionType;


/**
 * @type {ConvertFunctionType}
 */
let convertFunction = undefined;


/**
 * Converter for GeometryCollections
 */
class GeometryCollectionConverter extends BaseConverter {
  /**
   * @inheritDoc
   */
  create(feature, geometry, style, context) {
    return convert(feature, geometry, style, context);
  }


  /**
   * @inheritDoc
   */
  update(feature, geometry, style, context, primitive) {
    return convert(feature, geometry, style, context);
  }

  /**
   * @param {ConvertFunctionType} value
   */
  static setConvertFunction(value) {
    convertFunction = value;
  }
}


/**
 * @param {!Feature} feature
 * @param {!GeometryCollection} geometry
 * @param {!Style} style
 * @param {!VectorContext} context
 * @return {boolean}
 */
const convert = (feature, geometry, style, context) => {
  const geoms = geometry.getGeometriesArray();
  if (convertFunction) {
    for (let i = 0, n = geoms.length; i < n; i++) {
      const geom = geoms[i];
      if (geom) {
        convertFunction(feature, geom, style, context);
      }
    }

    return true;
  }

  return false;
};


exports = GeometryCollectionConverter;
