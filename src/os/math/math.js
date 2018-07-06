goog.provide('os.math');


/**
 * default decimal precision
 * @type {number}
 */
os.math.DEFAULT_DECIMAL_PRECISION = 3;


/**
 * Rounds a number to opt_fixed decimal points
 * @param {number} num The number to round
 * @param {number=} opt_fixed Optional precision, defaults to 3
 * @return {string}
 */
os.math.toFixed = function(num, opt_fixed) {
  opt_fixed = goog.isDefAndNotNull(opt_fixed) ? opt_fixed : os.math.DEFAULT_DECIMAL_PRECISION;
  return num.toFixed(opt_fixed);
};


/**
 * Rounds a number to opt_precision decimal points
 * @param {number} num The number to round
 * @param {number=} opt_precision Optional precision, defaults to 6
 * @return {string}
 */
os.math.toPrecision = function(num, opt_precision) {
  opt_precision = opt_precision || 6;
  return num.toPrecision(opt_precision);
};


/**
 * Round the decimals to the precision
 * @param {number} num
 * @param {number} precision
 * @return {number}
 */
os.math.roundWithPrecision = function(num, precision) {
  var multiplier = Math.pow(10, precision);
  return Math.round(num * multiplier) / multiplier;
};


/**
 * Determine the max of many numbers
 * @param {!Array.<!number>} values
 * @return {?number} the max value, or null if the array is empty
 */
os.math.max = function(values) {
  var max = values.length > 0 ? values[0] : null;
  for (var i = 1, ii = values.length; i < ii; i++) {
    max = Math.max(values[i], max);
  }
  return max;
};


/**
 * Determine the min of many numbers
 * @param {!Array.<!number>} values
 * @return {?number} the min value, or null if the array is empty
 */
os.math.min = function(values) {
  var min = values.length > 0 ? values[0] : null;
  for (var i = 1, ii = values.length; i < ii; i++) {
    min = Math.min(values[i], min);
  }
  return min;
};


/**
 * Determine the precision of a number.
 * @param {number} value The number
 * @return {number} The precision. Returns 0 for integer, NaN, and infinite values.
 */
os.math.precision = function(value) {
  if (!isFinite(value)) {
    return 0;
  }

  var exponent = 1;
  var precision = 0;
  while (Math.round(value * exponent) / exponent !== value) {
    exponent *= 10;
    precision++;
  }

  return precision;
};


/**
 * Determine the range of many numbers.  To keep it light, the result is a array of size 2, which clients
 * may use to construct a {@link goog.math.Range}
 * @param {!Array.<!number>} values
 * @return {?Array.<!number>} An array of size 2 in the form of [min, max], or null if the input is an empty array.
 */
os.math.range = function(values) {
  var range = null;
  if (values.length > 0) {
    range = [os.math.min(values), os.math.max(values)];
  }
  return range;
};


/**
 * Parses a value to a number, returning NaN for null values and empty strings.
 * @param {*} value The value.
 * @return {number} The numeric value, or NaN.
 */
os.math.parseNumber = function(value) {
  if (typeof value === 'number') {
    return value;
  } else if (typeof value === 'string') {
    // don't return 0 for empty strings
    value = value.trim();
    if (value) {
      return Number(value);
    }
  } // ignore all other types (boolean, object, function)

  // couldn't parse a number, so return NaN
  return NaN;
};


/**
 * Returns the integer part of a number by removing any fractional digits.
 * @param {(string|number)} val The number to truncate
 * @return {number}
 */
os.math.trunc = function(val) {
  return val < 0 ? Math.ceil(val) : Math.floor(val);
};
