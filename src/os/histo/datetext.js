goog.declareModuleId('os.histo.datetext');

/**
 * @typedef {function(number,number):string}
 */
export let OpFunction;

/**
 * @param {number} keyIndex
 * @param {number} fdoy
 * @return {string}
 */
export const week = function(keyIndex, fdoy) {
  return 'Day of Week: ' + moment().isoWeekday(keyIndex).format('dddd'); // day of week
};

/**
 * @param {number} keyIndex
 * @param {number} fdoy
 * @return {string}
 */
export const month = function(keyIndex, fdoy) {
  return 'Day of Month: ' + (keyIndex + 1); // day of month
};

/**
 * @param {number} keyIndex
 * @param {number} fdoy
 * @return {string}
 */
export const year = function(keyIndex, fdoy) {
  return 'Day of Year: ' + moment(fdoy + keyIndex * 86400000).format('YYYY-MM-DD'); // date string
};

/**
 * A map of datetext strings for use with the OpsClock
 * @type {Object<string, OpFunction> }
 */
export const TYPES = {
  'Hour of Week': week,
  'Hour of Month': month,
  'Hour of Year': year
};
