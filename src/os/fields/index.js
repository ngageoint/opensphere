goog.declareModuleId('os.fields');

import Fields from './fields.js';

const {default: ColumnDefinition} = goog.requireType('os.data.ColumnDefinition');


/**
 * Default units for Altitude
 * @type {string}
 */
export const DEFAULT_ALT_UNIT = 'm';

/**
 * Default units for Bearing
 * @type {string}
 */
export const DEFAULT_BEARING_UNIT = 'degrees';

/**
 * Default units for Semi Min/Semi Maj
 * @type {string}
 */
export const DEFAULT_RADIUS_UNIT = 'nmi';

/**
 * Indicator for a derived column
 * @type {string}
 */
export const DERIVED_COL_INDICATOR = '*';

/**
 * Default field/column name for Altitude
 * @type {string}
 */
export const DEFAULT_ALT_COL_NAME = Fields.ALT + ' (' + DEFAULT_ALT_UNIT + ')' + DERIVED_COL_INDICATOR;

/**
 * Default field/column name for Radius
 * @type {string}
 */
export const DEFAULT_RADIUS_COL_NAME = Fields.RADIUS + ' (' + DEFAULT_RADIUS_UNIT + ')' + DERIVED_COL_INDICATOR;

/**
 * Default field/column name for Bearing
 * @type {string}
 */
export const DEFAULT_BEARING_COL_NAME = Fields.BEARING + ' (' + DEFAULT_BEARING_UNIT + ')' + DERIVED_COL_INDICATOR;

/**
 * Default field/column name for Semi Minor
 * @type {string}
 */
export const DEFAULT_SEMI_MIN_COL_NAME = Fields.SEMI_MINOR + ' (' + DEFAULT_RADIUS_UNIT + ')' + DERIVED_COL_INDICATOR;

/**
 * Default field/column name for Semi Major
 * @type {string}
 */
export const DEFAULT_SEMI_MAJ_COL_NAME = Fields.SEMI_MAJOR + ' (' + DEFAULT_RADIUS_UNIT + ')' + DERIVED_COL_INDICATOR;

/**
 * Description field regex.
 * @type {RegExp}
 */
export const DESC_REGEXP = /^desc(ription)?$/i;

/**
 * Hide specific columns
 *
 * @param {ColumnDefinition} colDef
 */
export const hideSpecialColumns = function(colDef) {
  var field = colDef['field'];
  // hide units columns and any other columns we are creating derived columns from
  if (field == Fields.ALT_UNITS || field == Fields.RADIUS_UNITS || field == Fields.SEMI_MINOR_UNITS ||
      field == Fields.SEMI_MAJOR_UNITS || field == Fields.BEARING || field == Fields.RADIUS ||
      field == Fields.ALT || field == Fields.SEMI_MINOR || field == Fields.SEMI_MAJOR) {
    colDef['visible'] = false;
  }
};

/**
 * Return whether a column is derived from another
 * @param {ColumnDefinition} column
 * @return {boolean}
 */
export const isDerived = (column) => !!column['derivedFrom'];

/**
 * mark a column as derived
 *
 * @param {ColumnDefinition} colDef
 */
export const markDerived = function(colDef) {
  var field = colDef['field'];
  if (field == DEFAULT_SEMI_MAJ_COL_NAME) {
    colDef['toolTip'] = 'Derived Column';
    colDef['derivedFrom'] = Fields.SEMI_MAJOR;
  } else if (field == DEFAULT_SEMI_MIN_COL_NAME) {
    colDef['toolTip'] = 'Derived Column';
    colDef['derivedFrom'] = Fields.SEMI_MINOR;
  } else if (field == DEFAULT_RADIUS_COL_NAME) {
    colDef['toolTip'] = 'Derived Column';
    colDef['derivedFrom'] = Fields.RADIUS;
  } else if (field == DEFAULT_ALT_COL_NAME) {
    colDef['toolTip'] = 'Derived Column';
    colDef['derivedFrom'] = Fields.ALT;
  }
};
