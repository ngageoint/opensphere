goog.provide('plugin.cesium.sync.ConverterTypes');


/**
 * @typedef {!function(!ol.Feature, !ol.geom.Geometry, !ol.style.Style, !plugin.cesium.VectorContext):boolean}
 */
plugin.cesium.sync.ConverterTypes.CreateFunction;


/**
 * @typedef {!function(!ol.Feature, !ol.geom.Geometry, !ol.style.Style, !plugin.cesium.VectorContext):(Cesium.PrimitiveLike|null|undefined)}
 */
plugin.cesium.sync.ConverterTypes.RetrieveFunction;


/**
 * @typedef {!function(!ol.Feature, !ol.geom.Geometry, !ol.style.Style, !plugin.cesium.VectorContext, !Cesium.PrimitiveLike):boolean}
 */
plugin.cesium.sync.ConverterTypes.UpdateFunction;


/**
 * @typedef {{
 *  create: plugin.cesium.sync.ConverterTypes.CreateFunction,
 *  retrieve: plugin.cesium.sync.ConverterTypes.RetrieveFunction,
 *  update: plugin.cesium.sync.ConverterTypes.UpdateFunction,
 *  delete: plugin.cesium.sync.ConverterTypes.UpdateFunction
 * }}
 */
plugin.cesium.sync.ConverterTypes.Converter;
