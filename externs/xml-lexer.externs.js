/**
 * @externs
 */
var xmlLexer = {};


/**
 * @return {xmlLexer.Lexer}
 */
xmlLexer.create = function() {};


/**
 * @typedef {{
 *  type: string,
 *  value: string
 * }}
 */
xmlLexer.Data;


/**
 * @constructor
 */
xmlLexer.Lexer;

/**
 * @param {!string} type
 * @param {function(xmlLexer.Data)} handler
 */
xmlLexer.Lexer.prototype.on = function(type, handler) {};

/**
 * @param {!string} type
 * @param {function(xmlLexer.Data)} handler
 */
xmlLexer.Lexer.prototype.off = function(type, handler) {};

/**
 * @param {string} str
 */
xmlLexer.Lexer.prototype.write = function(str) {};
