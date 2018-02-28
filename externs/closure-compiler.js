/* eslint-disable */
/**
 * @fileoverview Definitions for externs that are either missing or incorrect
 * in the current release version of the closure compiler we use.
 *
 * The entries must be removed once they are available/correct in the
 * version we use.
 *
 * This file was copied from OpenLayers 3, with a few things omitted. They are
 * using an older version of the Closure Compiler and our newer version has
 * added some of the externs in their version.
 *
 * @externs
 */

// @see https://code.google.com/p/closure-compiler/issues/detail?id=1084


/**
 * Prevent the compiler from naming something $0 because that will prevent us from using it in Dev Tools.
 * @type {Object}
 */
var $0;


/**
 * Saves a blob to a local file.
 *
 * Note: This is implemented by a polyfill in filesaver.js.
 *
 * @param {Blob} blob
 * @param {string=} opt_fileName
 * @param {string=} opt_contentType
 * @return {boolean}
 */
var saveAs = function(blob, opt_fileName, opt_contentType) {};


/**
 * Saves text content to a local file. This should be used in IE9, where saveAs will not work. Only supports text
 * content, meaning a canvas cannot be saved.
 *
 * Note: This is implemented by a polyfill in filesaver.js.
 *
 * @param {string} textContent
 * @param {string=} opt_fileName
 * @param {string=} opt_contentType
 * @return {boolean}
 */
var saveTextAs = function(textContent, opt_fileName, opt_contentType) {};


/** @type {number} */
Touch.prototype.force;


/** @type {number} */
Touch.prototype.radiusX;


/** @type {number} */
Touch.prototype.radiusY;


/** @type {number} */
Touch.prototype.webkitForce;


/** @type {number} */
Touch.prototype.webkitRadiusX;


/** @type {number} */
Touch.prototype.webkitRadiusY;


/** @type {number} */
WheelEvent.DOM_DELTA_PIXEL;


/** @type {number} */
WheelEvent.DOM_DELTA_LINE;


/** @type {number} */
WheelEvent.DOM_DELTA_PAGE;


/** @type {?number} */
DeviceRotationRate.prototype.alpha;


/** @type {?number} */
DeviceRotationRate.prototype.beta;


/** @type {?number} */
DeviceRotationRate.prototype.gamma;


// @see https://code.google.com/p/closure-compiler/issues/detail?id=1088


/** @type {?number} */
DeviceOrientationEvent.prototype.webkitCompassAccuracy;


/** @type {?number} */
DeviceOrientationEvent.prototype.webkitCompassHeading;


/** @type {Storage} */
var localStorage;


/**
 * Added by Electron to expose the file's real path on filesystem.
 * @type {string|undefined}
 *
 * @see https://electronjs.org/docs/api/file-object
 */
File.prototype.path;
