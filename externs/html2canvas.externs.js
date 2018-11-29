/**
 * @fileoverview Externs for the html2canvas library.
 * @externs
 */

/**
 * Draws an HTML element to a canvas.
 * @param {Element} el The HTML element.
 * @param {html2canvas.Options=} opt_options
 * @return {Promise<HTMLCanvasElement>}
 */
var html2canvas = function(el, opt_options) {};

/**
 * @typedef {{
 *   async: (boolean|undefined),
 *   allowTaint: (boolean|undefined),
 *   backgroundColor: (string|undefined),
 *   canvas: (HTMLCanvasElement|undefined),
 *   foreignObjectRendering: (boolean|undefined),
 *   imageTimeout: (number|undefined),
 *   ignoreElements: (function(Element):boolean|undefined),
 *   logging: (boolean|undefined),
 *   onclone: (Function|undefined),
 *   proxy: (string|undefined),
 *   removeContainer: (boolean|undefined),
 *   scale: (number|undefined),
 *   useCORS: (boolean|undefined),
 *   width: (number|undefined),
 *   height: (number|undefined),
 *   x: (number|undefined),
 *   y: (number|undefined),
 *   scrollX: (number|undefined),
 *   scrollY: (number|undefined),
 *   windowWidth: (number|undefined),
 *   windowHeight: (number|undefined)
 * }}
 */
html2canvas.Options;
