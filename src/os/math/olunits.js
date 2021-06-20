goog.module('os.math.OLUnits');
goog.module.declareLegacyNamespace();

const Units = goog.require('os.math.Units');


/**
 * Supported OL3 unit types. Key is for ol.control.ScaleLineUnits, value is for math library conversion.
 * @enum {string}
 */
exports = {
  'metric': Units.KILOMETERS,
  'imperial': Units.MILES,
  'nautical': Units.NAUTICAL_MILES
};
