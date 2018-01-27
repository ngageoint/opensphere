goog.provide('os.math.AngleUnits');
goog.provide('os.math.OLUnits');
goog.provide('os.math.UnitLabels');
goog.provide('os.math.Units');

goog.require('ol.control.ScaleLineUnits');
goog.require('os.math');


/**
 * Supported unit types.
 * @enum {string}
 */
os.math.Units = {
  KILOMETERS: 'km',
  METERS: 'm',
  NAUTICAL_MILES: 'nmi',
  MILES: 'mi',
  FEET: 'ft'
};


/**
 * Supported unit types.
 * @enum {string}
 */
os.math.AngleUnits = {
  DEGREES: 'degrees'
};


/**
 * Supported OL3 unit types. Key is for ol.control.ScaleLineUnits, value is for math library conversion.
 * @enum {string}
 */
os.math.OLUnits = {
  'metric': os.math.Units.KILOMETERS,
  'imperial': os.math.Units.MILES,
  'nautical': os.math.Units.NAUTICAL_MILES
};


/**
 * Maps user-facing unit labels to unit values.
 * @enum {string}
 */
os.math.UnitLabels = {
  'Kilometers': os.math.Units.KILOMETERS,
  'Meters': os.math.Units.METERS,
  'Nautical Miles': os.math.Units.NAUTICAL_MILES,
  'Miles': os.math.Units.MILES,
  'Feet': os.math.Units.FEET
};


/**
 * Readable number formats.
 * @type {Array<string>}
 */
os.math.ReadableNumbers = [
  '',
  'k',
  ' Million',
  ' Billion',
  ' Trillion'
];


/**
 * @type {number}
 */
os.math.METERS_TO_FEET = 3.28084;


/**
 * @type {number}
 */
os.math.METERS_TO_MILES = os.math.METERS_TO_FEET / 5280;


/**
 * @type {number}
 */
os.math.METERS_TO_NAUTICAL_MILES = os.math.METERS_TO_FEET / 6076;


/**
 * @type {number}
 */
os.math.METERS_TO_KILOMETERS = .001;


/**
 * function to simplify unit conversion
 * @param {number} value
 * @param {string} newUnit
 * @param {string=} opt_oldUnit
 * @return {number} new unit
 */
os.math.convertUnits = function(value, newUnit, opt_oldUnit) {
  var oldUnit = opt_oldUnit || os.math.Units.METERS;
  if (oldUnit == newUnit) {
    // short circuit if the units aren't changing
    return value;
  }

  // convert to meters first
  if (oldUnit != os.math.Units.METERS) {
    switch (oldUnit) {
      case os.math.Units.KILOMETERS:
        value = value / os.math.METERS_TO_KILOMETERS;
        break;
      case os.math.Units.NAUTICAL_MILES:
        value = value / os.math.METERS_TO_NAUTICAL_MILES;
        break;
      case os.math.Units.MILES:
        value = value / os.math.METERS_TO_MILES;
        break;
      case os.math.Units.FEET:
        value = value / os.math.METERS_TO_FEET;
        break;
      default:
        return NaN;
    }
  }

  // convert to the new units
  var multiplier = 1;
  switch (newUnit) {
    case os.math.Units.METERS:
      break;
    case os.math.Units.KILOMETERS:
      multiplier = os.math.METERS_TO_KILOMETERS;
      break;
    case os.math.Units.MILES:
      multiplier = os.math.METERS_TO_MILES;
      break;
    case os.math.Units.FEET:
      multiplier = os.math.METERS_TO_FEET;
      break;
    case os.math.Units.NAUTICAL_MILES:
      multiplier = os.math.METERS_TO_NAUTICAL_MILES;
      break;
    default:
      return NaN;
  }

  return value * multiplier;
};


/**
 * function to simplify unit conversion
 * @param {number} value
 * @param {string} newUnit
 * @param {string=} opt_oldUnit
 * @return {string} new unit
 */
os.math.stringifyUnits = function(value, newUnit, opt_oldUnit) {
  var oldUnit = opt_oldUnit || os.math.Units.METERS;
  var newVal = os.math.convertUnits(value, newUnit, oldUnit);
  if (isNaN(newVal)) {
    return 'Units unsupported (' + oldUnit + ' to ' + newUnit + ')';
  }

  if (newVal < .1) {
    if (newUnit == os.math.Units.MILES) {
      // return partial miles as feet
      newVal *= 5280;
      newUnit = os.math.Units.FEET;
    } else if (newUnit == os.math.Units.NAUTICAL_MILES) {
      // return partial nautical miles as feet
      newVal *= 6076;
      newUnit = os.math.Units.FEET;
    } else if (newUnit == os.math.Units.KILOMETERS) {
      // return partial kilometers as meters
      newVal = newVal / os.math.METERS_TO_KILOMETERS;
      newUnit = os.math.Units.METERS;
    }
  }

  return os.math.toFixed(newVal) + ' ' + newUnit;
};


/**
 * get the next key based on your current key
 * @param {string} current
 * @return {string} next key
 */
os.math.getNextUnit = function(current) {
  var found = false;
  for (var key in os.math.OLUnits) {
    if (found) {
      return key;
    }
    if (os.math.OLUnits[key] == current) {
      found = true;
    }
  }
  return goog.object.getKeys(os.math.OLUnits)[0];
};



/**
 * Convert a numeric value to a human readable string
 * @param {number} num
 * @return {string}
 */
os.math.readableNumber = function(num) {
  var e = Math.floor(Math.log(num) / Math.log(1000));
  if (num >= 1000) {
    return (num / Math.pow(1000, e)).toFixed(2) + os.math.ReadableNumbers[e];
  } else {
    return num.toString();
  }
};
