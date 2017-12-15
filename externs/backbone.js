/**
 * @fileoverview Externs for backbone.
 *
 * @externs
 */


/**
 * @type {Object}
 * @const
 */
var Backbone = {};



/**
 * @constructor
 * @param {*=} opt_attributes
 * @param {*=} opt_options
 */
Backbone.Model = function(opt_attributes, opt_options) {};


/**
 * @param {...*} var_args
 */
Backbone.Model.prototype.parseSpellcheck = function(var_args) {};


/**
 * @param {...*} var_args
 */
Backbone.Model.prototype.mergeResults = function(var_args) {};


/**
 * @param {...*} var_args
 */
Backbone.Model.prototype.initialize = function(var_args) {};


/**
 * @param {...*} var_args
 */
Backbone.Model.prototype.parse = function(var_args) {};


/**
 * @param {...*} var_args
 */
Backbone.Model.prototype.highlightTerms = function(var_args) {};


/**
 * @param {...*} var_args
 */
Backbone.Model.prototype.findDoc = function(var_args) {};


/**
 * @param {...*} var_args
 */
Backbone.Model.prototype.fetch = function(var_args) {};


/**
 * @param {...*} var_args
 * @return {function(): Backbone.Model}
 */
Backbone.Model.extend = function(var_args) {};


/**
 * @type {Object}
 * @const
 */
Backbone.Collection = {};


/**
 * @param {...*} var_args
 * @return {function(): Backbone.Model}
 */
Backbone.Collection.extend = function(var_args) {};
