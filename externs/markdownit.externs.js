/**
 * @fileoverview Externs for Toast UI Editor
 *
 * @externs
 */



/**
 * @param {Object=} opt_options
 * @constructor
 */
var Markdownit = function(opt_options) {};

/**
 * @type {Object}
 */
Markdownit.prototype.core = {};


/**
 * @type {Object}
 */
Markdownit.prototype.core.ruler = {};


/**
 * @param {Object=} opt_options
 * @return {Markdownit}
 */
var markdownit = function(opt_options) {};


/**
 * @typedef {{
 *   attrs: (Object),
 *   attrIndex: (Function),
 *   attrPush: (Function)
 * }}
 */
Markdownit.Token;
