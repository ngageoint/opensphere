goog.module('os.math');

const Units = goog.require('os.math.Units');
const OLUnits = goog.require('os.math.OLUnits');


/**
 * default decimal precision
 * @type {number}
 */
const DEFAULT_DECIMAL_PRECISION = 3;

/**
 * Rounds a number to opt_fixed decimal points
 *
 * @param {number} num The number to round
 * @param {number=} opt_fixed Optional precision, defaults to 3
 * @return {string}
 */
const toFixed = function(num, opt_fixed) {
  opt_fixed = opt_fixed != null ? opt_fixed : DEFAULT_DECIMAL_PRECISION;
  return num.toFixed(opt_fixed);
};

/**
 * Rounds a number to opt_precision decimal points
 *
 * @param {number} num The number to round
 * @param {number=} opt_precision Optional precision, defaults to 6
 * @return {string}
 */
const toPrecision = function(num, opt_precision) {
  opt_precision = opt_precision || 6;
  return num.toPrecision(opt_precision);
};

/**
 * Round the decimals to the precision
 *
 * @param {number} num
 * @param {number} precision
 * @return {number}
 */
const roundWithPrecision = function(num, precision) {
  var multiplier = Math.pow(10, precision);
  return Math.round(num * multiplier) / multiplier;
};

/**
 * Determine the max of many numbers
 *
 * @param {!Array.<!number>} values
 * @return {?number} the max value, or null if the array is empty
 */
const max = function(values) {
  var max = values.length > 0 ? values[0] : null;
  for (var i = 1, ii = values.length; i < ii; i++) {
    max = Math.max(values[i], max);
  }
  return max;
};

/**
 * Determine the min of many numbers
 *
 * @param {!Array.<!number>} values
 * @return {?number} the min value, or null if the array is empty
 */
const min = function(values) {
  var min = values.length > 0 ? values[0] : null;
  for (var i = 1, ii = values.length; i < ii; i++) {
    min = Math.min(values[i], min);
  }
  return min;
};

/**
 * Determine the precision of a number.
 *
 * @param {number} value The number
 * @return {number} The precision. Returns 0 for integer, NaN, and infinite values.
 */
const precision = function(value) {
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
 *
 * @param {!Array.<!number>} values
 * @return {?Array.<!number>} An array of size 2 in the form of [min, max], or null if the input is an empty array.
 */
const range = function(values) {
  var range = null;
  if (values.length > 0) {
    range = [min(values), max(values)];
  }
  return range;
};

/**
 * Parses a value to a number, returning NaN for null values and empty strings.
 *
 * @param {*} value The value.
 * @return {number} The numeric value, or NaN.
 */
const parseNumber = function(value) {
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
 *
 * @param {(string|number)} val The number to truncate
 * @return {number}
 */
const trunc = function(val) {
  return val < 0 ? Math.ceil(val) : Math.floor(val);
};


/**
 * TODO: Units related math code. This should be in an os.units namespace, but it's referenced in hundreds
 * of places on os.math. At some point we should clean this up.
 */


/**
 * Readable number formats.
 * @type {Array<string>}
 */
const ReadableNumbers = [
  '',
  'k',
  ' Million',
  ' Billion',
  ' Trillion'
];

/**
 * @type {number}
 */
const METERS_TO_FEET = 3.28084;

/**
 * @type {number}
 */
const METERS_TO_MILES = METERS_TO_FEET / 5280;

/**
 * @type {number}
 */
const METERS_TO_NAUTICAL_MILES = METERS_TO_FEET / 6076;

/**
 * @type {number}
 */
const METERS_TO_KILOMETERS = .001;

/**
 * @type {number}
 */
const METERS_TO_YARDS = 1.09361;

/**
 * function to simplify unit conversion
 *
 * @param {number} value
 * @param {string} newUnit
 * @param {string=} opt_oldUnit
 * @return {number} new unit
 */
const convertUnits = function(value, newUnit, opt_oldUnit) {
  var oldUnit = opt_oldUnit || Units.METERS;
  if (oldUnit == newUnit) {
    // short circuit if the units aren't changing
    return value;
  }

  // convert to meters first
  if (oldUnit != Units.METERS) {
    switch (oldUnit) {
      case Units.KILOMETERS:
        value = value / METERS_TO_KILOMETERS;
        break;
      case Units.NAUTICAL_MILES:
        value = value / METERS_TO_NAUTICAL_MILES;
        break;
      case Units.MILES:
        value = value / METERS_TO_MILES;
        break;
      case Units.FEET:
        value = value / METERS_TO_FEET;
        break;
      case Units.YARD:
        value = value / METERS_TO_YARDS;
        break;
      default:
        return NaN;
    }
  }

  // convert to the new units
  var multiplier = 1;
  switch (newUnit) {
    case Units.METERS:
      break;
    case Units.KILOMETERS:
      multiplier = METERS_TO_KILOMETERS;
      break;
    case Units.MILES:
      multiplier = METERS_TO_MILES;
      break;
    case Units.FEET:
      multiplier = METERS_TO_FEET;
      break;
    case Units.YARD:
      multiplier = METERS_TO_YARDS;
      break;
    case Units.NAUTICAL_MILES:
      multiplier = METERS_TO_NAUTICAL_MILES;
      break;
    default:
      return NaN;
  }

  return value * multiplier;
};

/**
 * function to simplify unit conversion
 *
 * @param {number} value
 * @param {string} newUnit
 * @param {string=} opt_oldUnit
 * @return {string} new unit
 */
const stringifyUnits = function(value, newUnit, opt_oldUnit) {
  var oldUnit = opt_oldUnit || Units.METERS;
  var newVal = convertUnits(value, newUnit, oldUnit);
  if (isNaN(newVal)) {
    return 'Units unsupported (' + oldUnit + ' to ' + newUnit + ')';
  }

  if (newVal < .1) {
    if (newUnit == Units.MILES) {
      // return partial miles as feet
      newVal *= 5280;
      newUnit = Units.FEET;
    } else if (newUnit == Units.NAUTICAL_MILES) {
      // return partial nautical miles as feet
      newVal *= 6076;
      newUnit = Units.FEET;
    } else if (newUnit == Units.KILOMETERS) {
      // return partial kilometers as meters
      newVal = newVal / METERS_TO_KILOMETERS;
      newUnit = Units.METERS;
    }
  }

  return toFixed(newVal) + ' ' + newUnit;
};

/**
 * get the next key based on your current key
 *
 * @param {string} current
 * @return {string} next key
 */
const getNextUnit = function(current) {
  var found = false;
  for (var key in OLUnits) {
    if (found) {
      return key;
    }
    if (OLUnits[key] == current) {
      found = true;
    }
  }
  return Object.keys(OLUnits)[0];
};

/**
 * Convert a numeric value to a human readable string
 *
 * @param {number} num
 * @return {string}
 */
const readableNumber = function(num) {
  var e = Math.floor(Math.log(num) / Math.log(1000));
  if (num >= 1000) {
    return (num / Math.pow(1000, e)).toFixed(2) + ReadableNumbers[e];
  } else {
    return num.toString();
  }
};


exports = {
  DEFAULT_DECIMAL_PRECISION,
  toFixed,
  toPrecision,
  roundWithPrecision,
  max,
  min,
  precision,
  range,
  parseNumber,
  trunc,
  ReadableNumbers,
  METERS_TO_FEET,
  METERS_TO_KILOMETERS,
  METERS_TO_MILES,
  METERS_TO_NAUTICAL_MILES,
  METERS_TO_YARDS,
  convertUnits,
  stringifyUnits,
  getNextUnit,
  readableNumber
};
