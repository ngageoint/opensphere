goog.module('plugin.cesium.sync.ConverterTypes');


const Feature = goog.requireType('ol.Feature');
const Geometry = goog.requireType('ol.geom.Geometry');
const Style = goog.requireType('ol.style.Style');
const VectorContext = goog.requireType('plugin.cesium.VectorContext');



/**
 * @typedef {!function(!Feature, !Geometry, !Style, !VectorContext):boolean}
 */
let CreateFunction;


/**
 * @typedef {!function(!Feature, !Geometry, !Style, !VectorContext):(Cesium.PrimitiveLike|null|undefined)}
 */
let RetrieveFunction;


/**
 * @typedef {!function(!Feature, !Geometry, !Style, !VectorContext, !Cesium.PrimitiveLike):boolean}
 */
let UpdateFunction;


/**
 * @typedef {{
 *  create: CreateFunction,
 *  retrieve: RetrieveFunction,
 *  update: UpdateFunction,
 *  delete: UpdateFunction
 * }}
 */
let Converter;

exports = {
  CreateFunction,
  RetrieveFunction,
  UpdateFunction,
  Converter
};
