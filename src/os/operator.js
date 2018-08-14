goog.provide('os.operator');


/**
 * @typedef {function(*,*):boolean}
 */
os.operator.OpFunction;


/**
 * @param {*} a Left hand side of the operator
 * @param {*} b Right hand side of the operator
 * @return {boolean}
 */
os.operator.equalTo = function(a, b) {
  return a == b;
};


/**
 * @param {*} a Left hand side of the operator
 * @param {*} b Right hand side of the operator
 * @return {boolean}
 */
os.operator.notEqualTo = function(a, b) {
  return a === undefined || a != b;
};


/**
 * @param {*} a Left hand side of the operator
 * @param {*} b Right hand side of the operator
 * @return {boolean}
 */
os.operator.greaterThan = function(a, b) {
  return a > b;
};


/**
 * @param {*} a Left hand side of the operator
 * @param {*} b Right hand side of the operator
 * @return {boolean}
 */
os.operator.greaterThanOrEqualTo = function(a, b) {
  return a >= b;
};


/**
 * @param {*} a Left hand side of the operator
 * @param {*} b Right hand side of the operator
 * @return {boolean}
 */
os.operator.lessThan = function(a, b) {
  return a < b;
};


/**
 * @param {*} a Left hand side of the operator
 * @param {*} b Right hand side of the operator
 * @return {boolean}
 */
os.operator.lessThanOrEqualTo = function(a, b) {
  return a <= b;
};


/**
 * @param {*} a Left hand side of the operator
 * @param {*} b Right hand side of the operator
 * @return {boolean}
 */
os.operator.similarTo = function(a, b) {
  return a !== undefined && a.toString().toLowerCase().indexOf(b.toString().toLowerCase()) !== -1;
};


/**
 * @param {*} a Left hand side of the operator
 * @param {*} b Right hand side of the operator
 * @return {boolean}
 */
os.operator.notSimilarTo = function(a, b) {
  return a === undefined || a.toString().toLowerCase().indexOf(b.toString().toLowerCase()) === -1;
};


/**
 * A map of comparison operator functions to use with quick filters
 * @const
 * @type {Object<string, os.operator.OpFunction>}
 */
os.operator.TYPES = {
  '=': os.operator.equalTo,
  '!=': os.operator.notEqualTo,
  '>': os.operator.greaterThan,
  '>=': os.operator.greaterThanOrEqualTo,
  '<': os.operator.lessThan,
  '<=': os.operator.lessThanOrEqualTo,
  '~': os.operator.similarTo,
  '!~': os.operator.notSimilarTo
};
