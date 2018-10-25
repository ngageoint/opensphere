/**
 * @externs
 */
var jschardet = {};

/**
 * @typedef {{
 *  encoding: ?string,
 *  confidence: number
 * }}
 */
jschardet.Result;


/**
 * @param {string} binStr The binary string
 * @return {jschardet.Result}
 */
jschardet.detect = function(binStr) {};
