/**
 * @fileoverview Externs for Toast UI Editor
 *
 * @externs
 */


/**
 * @type {function(): Object}
 */
var markdownit = function() {};


/**
 * @type {Object}
 */
markdownit.prototype.core = {};


/**
 * @type {Object}
 */
markdownit.prototype.core.ruler = {};


/**
 * @type {Object}
 * @const
 */
var Markdownit = {};


/**
 * @typedef {{
 *   attrs: (Object),
 *   attrIndex: (Function),
 *   attrPush: (Function)
 * }}
 */
Markdownit.Token;
