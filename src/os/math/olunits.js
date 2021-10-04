goog.declareModuleId('os.math.OLUnits');

import Units from './units.js';


/**
 * Supported OL3 unit types. Key is for ol.control.ScaleLineUnits, value is for math library conversion.
 * @enum {string}
 */
const OLUnits = {
  'metric': Units.KILOMETERS,
  'imperial': Units.MILES,
  'nautical': Units.NAUTICAL_MILES
};

export default OLUnits;
