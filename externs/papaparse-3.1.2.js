/**
 * @fileoverview Externs for PapaParse v3.1.2
 * @externs
 */


/**
 * @type {Object}
 * @const
 */
var Papa = {};


/**
 * @type {number}
 */
Papa.LocalChunkSize;


/**
 * @type {number}
 */
Papa.RemoteChunkSize;


/**
 * @typedef {{
 *   delimiter: (string|undefined),
 *   newline: (string|undefined),
 *   quotes: (boolean|undefined)
 * }}
 */
Papa.UnparseConfig;


/**
 * @typedef {{
 *   fields: Array.<string>,
 *   data: Array.<Array.<string>>
 * }}
 */
Papa.UnparseData;


/**
 * @param {string|File} source
 * @param {Object.<string, *>} config
 * @return {Papa.Results}
 */
Papa.parse = function(source, config) {};


/**
 * @param {(Array.<Object.<string, string>>|Array.<Array.<string>>|Papa.UnparseData)} data
 * @param {Papa.UnparseConfig=} opt_config
 * @return {string}
 */
Papa.unparse = function(data, opt_config) {};


/**
 * @typedef {{
 *   abort: function(),
 *   pause: function(),
 *   resume: function()
 *   }}
 */
Papa.ParserHandle;


/**
 * @typedef {{
 *   data: (Array.<Object.<string, *>>|Array.<Array.<string, *>>),
 *   errors: Array.<Papa.Error>,
 *   meta: Papa.Meta
 *   }}
 */
Papa.Results;


/**
 * @typedef {{
 *   type: string,
 *   code: (string|number),
 *   message: string,
 *   line: number,
 *   row: number,
 *   index: number
 *   }}
 */
Papa.Error;


/**
 * @typedef {{
 *   lines: number,
 *   delimiter: string,
 *   aborted: boolean,
 *   fields: Array.<string>,
 *   truncated: boolean
 *   }}
 */
Papa.Meta;
