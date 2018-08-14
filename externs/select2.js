/**
 * @fileoverview Externs for Select2.
 *
 * @externs
 */


/**
 * @type {Object}
 * @const
 */
var select2 = {};


/**
 * @typedef {{
 *   val: *
 * }}
 */
select2.ChangeEvent;


/**
 * @typedef {{
 *   more: boolean,
 *   results: Array
 * }}
 */
select2.QueryData;


/**
 * @typedef {{
 *   callback: function(select2.QueryData),
 *   page: number,
 *   term: string
 * }}
 */
select2.Query;


/**
 * @typedef {{
 *   data: Array.<Object>,
 *   formatSelect: Function,
 *   formatResult: Function,
 *   id: Function,
 *   initSelection: function(Element, Function),
 *   placeholder: string,
 *   quietMillis: number,
 *   query: function(select2.Query)
 * }}
 */
select2.Options;


/**
 * @param {select2.Options} options
 * @return {!angular.JQLite}
 */
angular.JQLite.select2 = function(options) {};
