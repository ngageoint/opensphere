/* eslint-disable opensphere/no-unused-vars */
/**
 * @fileoverview Externs for parsing a Mapbox style document.
 * @externs
 * @see https://docs.mapbox.com/mapbox-gl-js/style-spec/
 */

/**
 * @typedef {{
 *   filter: (Array|undefined),
 *   id: string,
 *   layout: (Object|undefined),
 *   maxzoom: (number|undefined),
 *   metadata: (Object|undefined),
 *   minzoom: (number|undefined),
 *   paint: (Object|undefined),
 *   source: (string|undefined),
 *   source-layer: (string|undefined),
 *   type: string
 * }}
 */
var MapboxLayer;

/**
 * @typedef {{
 *   bearing: (number|undefined),
 *   center: (Array<number>|undefined),
 *   glyphs: (string|undefined),
 *   id: string,
 *   layers: !Array<!MapboxLayer>,
 *   light: (Object|undefined),
 *   metadata: (Object|undefined),
 *   name: (string|undefined),
 *   pitch: (number|undefined),
 *   sources: !Object,
 *   transition: (Object|undefined),
 *   version: number,
 *   zoom: (number|undefined)
 * }}
 */
var MapboxStyle;

/**
 * Creates a style function from the `glStyle` object for all layers that use
 * the specified `source`, which needs to be a `"type": "vector"` or
 * `"type": "geojson"` source and applies it to the specified OpenLayers layer.
 *
 * @param {string|MapboxStyle} glStyle Mapbox Style object.
 * @param {string|Array<string>} source `source` key or an array of layer `id`s
 * from the Mapbox Style object. When a `source` key is provided, all layers for
 * the specified source will be included in the style function. When layer `id`s
 * are provided, they must be from layers that use the same source.
 * @param {Array<number>} resolutions for mapping resolution to zoom level.
 * @param {function(Array<string>):Array<string>} [getFonts=undefined] Function that
 * receives a font stack as arguments, and returns a (modified) font stack that
 * is available. Font names are the names used in the Mapbox Style object. If
 * not provided, the font stack will be used as-is. This function can also be
 * used for loading web fonts.
 * @return {function(Object, string, number):(Object|Array<Object>)} function which
 * takes the feature properties, geometry type, and resolution as arguments and
 * returns the style config(s).
 */
var parseMapboxStyle;
