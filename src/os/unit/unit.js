goog.module('os.unit');
goog.module.declareLegacyNamespace();


/**
 * Descriptor metrics tracked
 * @enum {string}
 */
const UnitSystem = {
  METRIC: 'metric',
  ENGLISH: 'imperial',
  NAUTICAL: 'nautical',
  NAUTICALMILE: 'nauticalmile',
  MILE: 'mile',
  YARD: 'yard',
  FEET: 'feet'
};

/**
 * @type {string}
 * @const
 */
const UNIT_TYPE_DISTANCE = 'distance';

/**
 * The base key used by all unit settings.
 * @type {string}
 * @const
 */
const UNITS = 'os.map.units';


exports = {
  UnitSystem,
  UNIT_TYPE_DISTANCE,
  UNITS
};
