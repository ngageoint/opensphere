/**
 * @fileoverview Externs for the GIF library.
 * @externs
 */


/**
 * Namespace for typedefs.
 * @type {Object}
 */
var gif = {};


/**
 * @typedef {{
 *   background: (number|string|undefined),
 *   cleanUp: (boolean|undefined),
 *   quality: (number|undefined),
 *   transparent: (number|undefined),
 *   workerScript: (string|undefined),
 *   workers: (number|undefined)
 * }}
 */
gif.GIFOptions;


/**
 * @typedef {{
 *   copy: (boolean|undefined),
 *   delay: (number|undefined)
 * }}
 */
gif.FrameOptions;



/**
 * GIF library constructor.
 * @param {gif.GIFOptions} options
 * @constructor
 */
var GIF = function(options) {};


/**
 *
 */
GIF.prototype.abort = function() {};


/**
 * @param {ImageData} frame
 * @param {gif.FrameOptions=} opt_options
 */
GIF.prototype.addFrame = function(frame, opt_options) {};


/**
 *
 */
GIF.prototype.cleanUp = function() {};


/**
 * @param {string} type
 * @param {function(?):?} listener
 */
GIF.prototype.on = function(type, listener) {};


/**
 *
 */
GIF.prototype.removeAllListeners = function() {};


/**
 *
 */
GIF.prototype.render = function() {};
