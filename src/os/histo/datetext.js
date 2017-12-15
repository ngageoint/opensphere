goog.provide('os.histo.datetext');

goog.require('os.time.TimeInstant');


/**
 * @typedef {function(number,number):string}
 */
os.histo.datetext.OpFunction;


/**
 * @param {number} keyIndex
 * @param {number} fdoy
 * @return {string}
 */
os.histo.datetext.week = function(keyIndex, fdoy) {
  return 'Day of Week: ' + moment().isoWeekday(keyIndex).format('dddd'); // day of week
};


/**
 * @param {number} keyIndex
 * @param {number} fdoy
 * @return {string}
 */
os.histo.datetext.month = function(keyIndex, fdoy) {
  return 'Day of Month: ' + (keyIndex + 1); // day of month
};


/**
 * @param {number} keyIndex
 * @param {number} fdoy
 * @return {string}
 */
os.histo.datetext.year = function(keyIndex, fdoy) {
  return 'Day of Year: ' + moment(fdoy + keyIndex * 86400000).format('YYYY-MM-DD'); // date string
};


/**
 * A map of datetext strings for use with the OpsClock
 * @const
 * @type {Object<string, os.histo.datetext.OpFunction> }
 */
os.histo.datetext.TYPES = {
  'Hour of Week': os.histo.datetext.week,
  'Hour of Month': os.histo.datetext.month,
  'Hour of Year': os.histo.datetext.year
};
