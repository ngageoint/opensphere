/**
 * @fileoverview Externs for Simplemde.
 *
 * @externs
 */



/**
 * @constructor
 */
var CodeMirror = function() {};


/**
 * @param {string} event
 * @param {Function} func
 */
CodeMirror.prototype.on = function(event, func) {};


/**
 * @return {string}
 */
CodeMirror.prototype.getValue = function() {};


CodeMirror.prototype.setSize = function() {};


CodeMirror.prototype.setOption = function(name, value, cm, cfg) {};


/**
 * @param {string} plainText
 * @return {string}
 */
CodeMirror.prototype.markdown = function(plainText) {};


/**
 * Get the position of the curser from the text area
 * @param {string} start string indicating which end of the selection to return
 * @return {Object} the position of the curser
 */
CodeMirror.prototype.getCursor = function(start) {};


/**
 * Inserts (or replaces) text in the specified spot.
 * @param {string} replacement the string to be inserted
 * @param {Object} from A {line,ch} object that indicates the spot in the string you want the insert to occur.
 * @param {?Object} to A {line,ch} object that indicates the ending spot for the replacement.
 *                     Note that this is only used if you are replacing a portion of the original text.
 * @param {?string} origin If this is provided, this gets passed to changed events and potentially merged
 *                         with previous history events.
 */
CodeMirror.prototype.replaceRange = function(replacement, from, to, origin) {};



/**
 * @constructor
 * @param {Object} options
 */
var SimpleMDE = function(options) {};

SimpleMDE.prototype.togglePreview = function() {};


/**
 * @param {string} text
 * @return {string}
 */
SimpleMDE.prototype.markdown = function(text) {};


/**
 * @type {CodeMirror}
 */
SimpleMDE.prototype.codemirror;


/**
 * @type {CodeMirror}
 */
SimpleMDE.prototype.parent;
