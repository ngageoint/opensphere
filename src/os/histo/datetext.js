goog.module('os.histo.datetext');
goog.module.declareLegacyNamespace();

/**
 * @typedef {function(number,number):string}
 */
let OpFunction;

/**
 * @param {number} keyIndex
 * @param {number} fdoy
 * @return {string}
 */
const week = function(keyIndex, fdoy) {
  return 'Day of Week: ' + moment().isoWeekday(keyIndex).format('dddd'); // day of week
};

/**
 * @param {number} keyIndex
 * @param {number} fdoy
 * @return {string}
 */
const month = function(keyIndex, fdoy) {
  return 'Day of Month: ' + (keyIndex + 1); // day of month
};

/**
 * @param {number} keyIndex
 * @param {number} fdoy
 * @return {string}
 */
const year = function(keyIndex, fdoy) {
  return 'Day of Year: ' + moment(fdoy + keyIndex * 86400000).format('YYYY-MM-DD'); // date string
};

/**
 * A map of datetext strings for use with the OpsClock
 * @type {Object<string, OpFunction> }
 */
const TYPES = {
  'Hour of Week': week,
  'Hour of Month': month,
  'Hour of Year': year
};

exports = {
  week,
  month,
  year,
  TYPES,
  OpFunction
};
