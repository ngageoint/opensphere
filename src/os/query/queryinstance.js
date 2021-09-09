goog.module('os.query.instance');

const {assert} = goog.require('goog.asserts');

const BaseFilterManager = goog.requireType('os.filter.BaseFilterManager');
const BaseAreaManager = goog.requireType('os.query.BaseAreaManager');
const BaseQueryManager = goog.requireType('os.query.BaseQueryManager');


/**
 * The global area manager instance.
 * @type {BaseAreaManager}
 */
let areaManager = null;

/**
 * Get the global area manager instance.
 * @return {!BaseAreaManager}
 */
const getAreaManager = () => {
  assert(areaManager != null, 'Area manager instance is not defined! Use setAreaManager to set the instance.');
  return areaManager;
};

/**
 * Set the global area manager instance.
 * @param {BaseAreaManager} value The instance.
 */
const setAreaManager = (value) => {
  areaManager = value;
};

/**
 * The global filter manager instance.
 * @type {BaseFilterManager}
 */
let filterManager = null;

/**
 * Get the global filter manager instance.
 * @return {!BaseFilterManager}
 */
const getFilterManager = () => {
  assert(filterManager != null, 'Filter manager instance is not defined! Use setFilterManager to set the instance.');
  return filterManager;
};

/**
 * Set the global filter manager instance.
 * @param {BaseFilterManager} value The instance.
 */
const setFilterManager = (value) => {
  filterManager = value;
};

/**
 * The global query manager instance.
 * @type {BaseQueryManager}
 */
let queryManager = null;

/**
 * Get the global query manager instance.
 * @return {!BaseQueryManager}
 */
const getQueryManager = () => {
  assert(queryManager != null, 'Query manager instance is not defined! Use setQueryManager to set the instance.');
  return queryManager;
};

/**
 * Set the global query manager instance.
 * @param {BaseQueryManager} value The instance.
 */
const setQueryManager = (value) => {
  queryManager = value;
};

exports = {
  getAreaManager,
  setAreaManager,
  getFilterManager,
  setFilterManager,
  getQueryManager,
  setQueryManager
};
