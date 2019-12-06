goog.module('plugin.cesium.sync.GeometryCollectionConverter');

const {deletePrimitive, getPrimitive} = goog.require('plugin.cesium.primitive');

const Feature = goog.requireType('ol.Feature');
const Geometry = goog.requireType('ol.geom.Geometry');
const Style = goog.requireType('ol.style.Style');
const VectorContext = goog.requireType('plugin.cesium.VectorContext');
const {CreateFunction, UpdateFunction, Converter} = goog.requireType('plugin.cesium.sync.ConverterTypes');


/**
 * @type {CreateFunction}
 */
const create = (feature, geometry, style, context) => {
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


/**
 * @type {UpdateFunction}
 */
const update = (feature, geometry, style, context, primitive) => false;


/**
 * @type {undefined|function(!Feature, !Geometry, !Style, !VectorContext):undefined}
 */
let convertFunction = undefined;


/**
 * @param {undefined|function(!Feature, !Geometry, !Style, !VectorContext):undefined} value
 */
const setConvertFunction = (value) => {
  convertFunction = value;
};


/**
 * @type {Converter}
 */
exports = {
  create,
  retrieve: getPrimitive,
  update,
  delete: deletePrimitive,
  setConvertFunction
};

