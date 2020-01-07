/**
 * @fileoverview Externs for Modernizr ^3.8.0
 * @externs
 */


/**
 * @type {!Object}
 */
var Modernizr = {};


/**
 * An async feature check
 * @param {string} checkName of async Modernizr check (e.g. indexeddb)
 * @param {function(Boolean)} callbackFn to execute on return of the async check
 */
Modernizr.on = function (checkName, callbackFn) {};


/**
 * @type {boolean}
 */
Modernizr.boxshadow;


/**
 * @type {boolean}
 */
Modernizr.canvas;


/**
 * @type {boolean}
 */
Modernizr.csspositionsticky;


/**
 * @type {boolean}
 */
Modernizr.fileinput;


/**
 * @type {boolean}
 */
Modernizr.filereader;


/**
 * @type {boolean}
 */
Modernizr.filesystem;


/**
 * @type {boolean}
 */
Modernizr.flexbox;


/**
 * @type {Boolean}
 */
Modernizr.indexeddb;


/**
 * @type {boolean}
 */
Modernizr.localstorage;


/**
 * @type {boolean}
 */
Modernizr.rgba;


/**
 * @type {boolean}
 */
Modernizr.sessionstorage;


/**
 * @type {boolean}
 */
Modernizr.svg;


/**
 * @type {boolean}
 */
Modernizr.webgl;


/**
 * @type {!Object<string, boolean>}
 */
Modernizr.webglextensions = {};


/**
 * @type {boolean}
 */
Modernizr.webglextensions.ANGLE_instanced_arrays;


/**
 * @type {boolean}
 */
Modernizr.webglextensions.EXT_texture_filter_anisotropic;


/**
 * @type {boolean}
 */
Modernizr.webglextensions.OES_element_index_uint;


/**
 * @type {boolean}
 */
Modernizr.webglextensions.OES_texture_float;


/**
 * @type {boolean}
 */
Modernizr.webglextensions.OES_texture_float_linear;


/**
 * @type {boolean}
 */
Modernizr.webglextensions.WEBGL_compressed_texture_s3tc;


/**
 * @type {boolean}
 */
Modernizr.webworkers;
