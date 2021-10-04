goog.declareModuleId('os.operator');

/**
 * @typedef {function(*,*):boolean}
 */
export let OpFunction;

/**
 * @param {*} a Left hand side of the operator
 * @param {*} b Right hand side of the operator
 * @return {boolean}
 */
export const equalTo = function(a, b) {
  return a == b;
};

/**
 * @param {*} a Left hand side of the operator
 * @param {*} b Right hand side of the operator
 * @return {boolean}
 */
export const notEqualTo = function(a, b) {
  return a === undefined || a != b;
};

/**
 * @param {*} a Left hand side of the operator
 * @param {*} b Right hand side of the operator
 * @return {boolean}
 */
export const greaterThan = function(a, b) {
  return a > b;
};

/**
 * @param {*} a Left hand side of the operator
 * @param {*} b Right hand side of the operator
 * @return {boolean}
 */
export const greaterThanOrEqualTo = function(a, b) {
  return a >= b;
};

/**
 * @param {*} a Left hand side of the operator
 * @param {*} b Right hand side of the operator
 * @return {boolean}
 */
export const lessThan = function(a, b) {
  return a < b;
};

/**
 * @param {*} a Left hand side of the operator
 * @param {*} b Right hand side of the operator
 * @return {boolean}
 */
export const lessThanOrEqualTo = function(a, b) {
  return a <= b;
};

/**
 * @param {*} a Left hand side of the operator
 * @param {*} b Right hand side of the operator
 * @return {boolean}
 */
export const similarTo = function(a, b) {
  return a !== undefined && a.toString().toLowerCase().indexOf(b.toString().toLowerCase()) !== -1;
};

/**
 * @param {*} a Left hand side of the operator
 * @param {*} b Right hand side of the operator
 * @return {boolean}
 */
export const notSimilarTo = function(a, b) {
  return a === undefined || a.toString().toLowerCase().indexOf(b.toString().toLowerCase()) === -1;
};

/**
 * A map of comparison operator functions to use with quick filters
 * @type {Object<string, OpFunction>}
 */
export const TYPES = {
  '=': equalTo,
  '!=': notEqualTo,
  '>': greaterThan,
  '>=': greaterThanOrEqualTo,
  '<': lessThan,
  '<=': lessThanOrEqualTo,
  '~': similarTo,
  '!~': notSimilarTo
};
