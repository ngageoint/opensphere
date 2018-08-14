/* eslint-disable */

/**
 * @fileoverview Externs for Crossfilter 1.4.0-alpha.6.
 * @externs
 */


/**
 * Temporary to fix THIN-8671. Please remove in THIN-8688.
 * @type {number}
 */
var i0;


/**
 * Temporary to fix THIN-8671. Please remove in THIN-8688.
 * @type {number}
 */
var i1;


/**
 * @param {Array.<Object>=} opt_data
 * @return {crossfilter.XF}
 */
var crossfilter = function(opt_data) {};


/**
 * @typedef {{
 *   id: string,
 *   start: number,
 *   end: number
 *   }}
 */
crossfilter.TimeRecord;


/**
 * @typedef {{
 *   add: function(Array.<Object>):crossfilter.XF,
 *   dimension: function(function(Object):*,boolean=):crossfilter.Dimension,
 *   groupAll: function():crossfilter.XF,
 *   remove: function(),
 *   size: function():number
 *   }}
 */
crossfilter.XF;


/**
 * @param {Array.<Object>} data
 * @return {crossfilter.XF}
 */
crossfilter.XF.add = function(data) {};


/**
 * @param {function(Object):*} fn
 * @param {boolean=} opt_isArray
 * @return {crossfilter.Dimension}
 */
crossfilter.XF.dimension = function(fn, opt_isArray) {};


/**
 * @return {crossfilter.Group}
 */
crossfilter.XF.groupAll = function() {};


/**
 *
 */
crossfilter.XF.remove = function() {};


/**
 * @return {number}
 */
crossfilter.XF.size = function() {};


/**
 * @typedef {{
 *   filter: function(*):crossfilter.Dimension,
 *   filterExact: function((Object|string|number)):crossfilter.Dimension,
 *   filterRange: function(Array.<Object|string|number>):crossfilter.Dimension,
 *   filterFunction: function(function(Object):boolean):crossfilter.Dimension,
 *   filterAll: function():crossfilter.Dimension,
 *   top: function(number):Array.<Object>,
 *   bottom: function(number):Array.<Object>,
 *   group: function((function(*):*)=):crossfilter.Group,
 *   groupAll: function():crossfilter.Group,
 *   dispose: function():crossfilter.Dimension,
 *   remove: function():crossfilter.Dimension
 *   }}
 */
crossfilter.Dimension;


/**
 * @param {*} value
 * @return {crossfilter.Dimension}
 */
crossfilter.Dimension.filter = function(value) {};


/**
 * @param {Object|string|number} value
 * @return {crossfilter.Dimension}
 */
crossfilter.Dimension.filterExact = function(value) {};


/**
 * @param {Array.<Object|string|number>} range
 * @return {crossfilter.Dimension}
 */
crossfilter.Dimension.filterRange = function(range) {};


/**
 * @param {function(Object):boolean} fn
 * @return {crossfilter.Dimension}
 */
crossfilter.Dimension.filterFunction = function(fn) {};


/**
 * @return {crossfilter.Dimension}
 */
crossfilter.Dimension.filterAll = function() {};


/**
 * @param {number} n
 * @return {Array.<Object>}
 */
crossfilter.Dimension.top = function(n) {};


/**
 * @param {number} n
 * @return {Array.<Object>}
 */
crossfilter.Dimension.bottom = function(n) {};


/**
 * @param {(function(*):*)=} opt_key
 * @return {crossfilter.Group}
 */
crossfilter.Dimension.group = function(opt_key) {};


/**
 * @return {crossfilter.Group}
 */
crossfilter.Dimension.groupAll = function() {};


/**
 * @return {crossfilter.Dimension}
 */
crossfilter.Dimension.dispose = function() {};


/**
 * @return {crossfilter.Dimension}
 */
crossfilter.Dimension.remove = function(value) {};


/**
 * @typedef {{
 *   key: string,
 *   value: *
 *   }}
 */
crossfilter.GroupKV;


/**
 * @typedef {{
 *   top: function(number):Array.<crossfilter.GroupKV>,
 *   all: function():Array.<crossfilter.GroupKV>,
 *   reduce: function(function(?, ?):?, function(?, ?):?, function():?):crossfilter.Group,
 *   reduceCount: function():crossfilter.Group,
 *   reduceSum: function():crossfilter.Group,
 *   order: function():crossfilter.Group,
 *   orderNatural: function():crossfilter.Group,
 *   size: function():number,
 *   dispose: function():crossfilter.Group,
 *   remove: function():crossfilter.Group
 *   }}
 */
crossfilter.Group;


/**
 * @param {number} n
 * @return {Array.<crossfilter.GroupKV>}
 */
crossfilter.Group.top = function(n) {};


/**
 * @return {Array.<crossfilter.GroupKV>}
 */
crossfilter.Group.all = function() {};


/**
 * @param {function(?, ?):?} reduceAdd
 * @param {function(?, ?):?} reduceRemove
 * @param {function():?} reduceInit
 * @return {crossfilter.Group}
 */
crossfilter.Group.reduce = function(reduceAdd, reduceRemove, reduceInit) {};


/**
 * @return {crossfilter.Group}
 */
crossfilter.Group.reduceCount = function() {};


/**
 * @return {crossfilter.Group}
 */
crossfilter.Group.reduceSum = function() {};


/**
 * @return {crossfilter.Group}
 */
crossfilter.Group.order = function() {};


/**
 * @return {crossfilter.Group}
 */
crossfilter.Group.orderNatural = function() {};


/**
 * @return {crossfilter.Group}
 */
crossfilter.Group.size = function() {};


/**
 * @return {crossfilter.Group}
 */
crossfilter.Group.dispose = function() {};


/**
 * @return {crossfilter.Group}
 */
crossfilter.Group.remove = function() {};
