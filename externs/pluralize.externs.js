/**
 * @fileoverview Externs for pluralize
 * @see https://github.com/blakeembrey/pluralize#readme
 * @externs
 */


/**
 * @constructor
 * @param {string} word
 * @param {number=} opt_count
 * @param {boolean=} opt_inclusive
 * @return {string}
 */
function pluralize(word, opt_count, opt_inclusive) {}


/**
 * @param {string} word
 * @return {string}
 */
pluralize.singular = function(word) {};


/**
 * @param {string} word
 * @return {string}
 */
pluralize.plural = function(word) {};


/**
 * @param {RegExp} re
 * @param {string} singular
 */
pluralize.addSingularRule = function(re, singular) {};


/**
 * @param {RegExp} re
 * @param {string} plural
 */
pluralize.addPluralRule = function(re, plural) {};


/**
 * @param {string} word
 * @param {string} irregular
 */
pluralize.addIrregularRule = function(word, irregular) {};


/**
 * @param {string} word
 */
pluralize.addUncountableRule = function(word) {};


/**
 * @param {RegExp} word
 * @return {string}
 */
pluralize.isSingular = function(word) {};


/**
 * @param {RegExp} word
 * @return {string}
 */
pluralize.isPlural = function(word) {};
