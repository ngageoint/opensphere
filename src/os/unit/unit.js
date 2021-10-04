goog.declareModuleId('os.unit');

/**
 * Descriptor metrics tracked
 * @enum {string}
 */
export const UnitSystem = {
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
export const UNIT_TYPE_DISTANCE = 'distance';

/**
 * The base key used by all unit settings.
 * @type {string}
 * @const
 */
export const UNITS = 'os.map.units';
