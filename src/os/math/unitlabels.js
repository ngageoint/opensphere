goog.declareModuleId('os.math.UnitLabels');

import Units from './units.js';


/**
 * Maps user-facing unit labels to unit values.
 * @enum {string}
 */
const UnitLabels = {
  'Kilometers': Units.KILOMETERS,
  'Meters': Units.METERS,
  'Nautical Miles': Units.NAUTICAL_MILES,
  'Miles': Units.MILES,
  'Feet': Units.FEET,
  'Yard': Units.YARD
};

export default UnitLabels;
