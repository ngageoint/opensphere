goog.module('os.math.UnitLabels');
goog.module.declareLegacyNamespace();

const Units = goog.require('os.math.Units');


/**
 * Maps user-facing unit labels to unit values.
 * @enum {string}
 */
exports = {
  'Kilometers': Units.KILOMETERS,
  'Meters': Units.METERS,
  'Nautical Miles': Units.NAUTICAL_MILES,
  'Miles': Units.MILES,
  'Feet': Units.FEET,
  'Yard': Units.YARD
};
