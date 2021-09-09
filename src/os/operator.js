goog.module('os.operator');

/**
 * @typedef {function(*,*):boolean}
 */
let OpFunction;

/**
 * @param {*} a Left hand side of the operator
 * @param {*} b Right hand side of the operator
 * @return {boolean}
 */
const equalTo = function(a, b) {
  return a == b;
};

/**
 * @param {*} a Left hand side of the operator
 * @param {*} b Right hand side of the operator
 * @return {boolean}
 */
const notEqualTo = function(a, b) {
  return a === undefined || a != b;
};

/**
 * @param {*} a Left hand side of the operator
 * @param {*} b Right hand side of the operator
 * @return {boolean}
 */
const greaterThan = function(a, b) {
  return a > b;
};

/**
 * @param {*} a Left hand side of the operator
 * @param {*} b Right hand side of the operator
 * @return {boolean}
 */
const greaterThanOrEqualTo = function(a, b) {
  return a >= b;
};

/**
 * @param {*} a Left hand side of the operator
 * @param {*} b Right hand side of the operator
 * @return {boolean}
 */
const lessThan = function(a, b) {
  return a < b;
};

/**
 * @param {*} a Left hand side of the operator
 * @param {*} b Right hand side of the operator
 * @return {boolean}
 */
const lessThanOrEqualTo = function(a, b) {
  return a <= b;
};

/**
 * @param {*} a Left hand side of the operator
 * @param {*} b Right hand side of the operator
 * @return {boolean}
 */
const similarTo = function(a, b) {
  return a !== undefined && a.toString().toLowerCase().indexOf(b.toString().toLowerCase()) !== -1;
};

/**
 * @param {*} a Left hand side of the operator
 * @param {*} b Right hand side of the operator
 * @return {boolean}
 */
const notSimilarTo = function(a, b) {
  return a === undefined || a.toString().toLowerCase().indexOf(b.toString().toLowerCase()) === -1;
};

/**
 * A map of comparison operator functions to use with quick filters
 * @type {Object<string, os.operator.OpFunction>}
 */
const TYPES = {
  '=': equalTo,
  '!=': notEqualTo,
  '>': greaterThan,
  '>=': greaterThanOrEqualTo,
  '<': lessThan,
  '<=': lessThanOrEqualTo,
  '~': similarTo,
  '!~': notSimilarTo
};

exports = {
  equalTo,
  notEqualTo,
  greaterThan,
  greaterThanOrEqualTo,
  lessThan,
  lessThanOrEqualTo,
  similarTo,
  notSimilarTo,
  TYPES,
  OpFunction
};
