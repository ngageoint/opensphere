goog.module('os.math.OLUnits');
goog.module.declareLegacyNamespace();

/**
 * Supported OL3 unit types. Key is for ol.control.ScaleLineUnits, value is for math library conversion.
 * @enum {string}
 */
exports = {
  'metric': os.math.Units.KILOMETERS,
  'imperial': os.math.Units.MILES,
  'nautical': os.math.Units.NAUTICAL_MILES
};
