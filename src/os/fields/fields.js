goog.provide('os.Fields');
goog.provide('os.fields');


/**
 * @enum {string}
 */
os.Fields = {
  ALT: 'ALTITUDE',
  ALT_UNITS: 'ALTITUDE_UNITS',
  BEARING: 'BEARING',
  CONFIDENCE: 'CONFIDENCE',
  DESCRIPTION: 'DESCRIPTION',
  ENDOFFSET: 'ENDOFFSET',
  FILENAME: 'FILENAME',
  FUZZY: 'FUZZY',
  GEOM_ALT: 'GEOM_ALT',
  GEOMETRY: 'GEOMETRY',
  GEOTAG: 'GEOTAG',
  ID: 'ID',
  LAT: 'LAT',
  LAT_DMS: 'LAT_DMS',
  LON: 'LON',
  LON_DMS: 'LON_DMS',
  MGRS: 'MGRS',
  NAME: 'NAME',
  ORIENTATION: 'ORIENTATION',
  PROPERTIES: 'PROPERTIES',
  RADIUS: 'RADIUS',
  RADIUS_UNITS: 'RADIUS_UNITS',
  SEMI_MAJOR: 'SEMI_MAJOR',
  SEMI_MAJOR_UNITS: 'SEMI_MAJ_UNITS',
  SEMI_MINOR: 'SEMI_MINOR',
  SEMI_MINOR_UNITS: 'SEMI_MINOR_UNITS',
  STARTOFFSET: 'STARTOFFSET',
  TIME: 'TIME'
};


/**
 * Default units for Altitude
 * @type {string}
 */
os.fields.DEFAULT_ALT_UNIT = 'm';


/**
 * Default units for Bearing
 * @type {string}
 */
os.fields.DEFAULT_BEARING_UNIT = 'degrees';


/**
 * Deafult units for Semi Min/Semi Maj
 * @type {string}
 */
os.fields.DEFAULT_RADIUS_UNIT = 'nmi';


/**
 * Indicator for a derived column
 * @type {string}
*/
os.fields.DERIVED_COL_INDICATOR = '*';


/**
 * Default field/column name for Altitude
 * @type {string}
 */
os.fields.DEFAULT_ALT_COL_NAME = os.Fields.ALT + ' (' +
    os.fields.DEFAULT_ALT_UNIT + ')' + os.fields.DERIVED_COL_INDICATOR;


/**
 * Default field/column name for Bearing
 * @type {string}
 */
os.fields.DEFAULT_BEARING_COL_NAME = os.Fields.BEARING + ' (' +
    os.fields.DEFAULT_BEARING_UNIT + ')' + os.fields.DERIVED_COL_INDICATOR;


/**
 * Default field/column name for Semi Minor
 * @type {string}
 */
os.fields.DEFAULT_SEMI_MIN_COL_NAME = os.Fields.SEMI_MINOR + ' (' +
    os.fields.DEFAULT_RADIUS_UNIT + ')' + os.fields.DERIVED_COL_INDICATOR;


/**
 * Default field/column name for Semi Major
 * @type {string}
 */
os.fields.DEFAULT_SEMI_MAJ_COL_NAME = os.Fields.SEMI_MAJOR + ' (' +
    os.fields.DEFAULT_RADIUS_UNIT + ')' + os.fields.DERIVED_COL_INDICATOR;


/**
 * Description field regex.
 * @type {RegExp}
 * @const
 */
os.fields.DESC_REGEXP = /^desc(ription)?$/i;


/**
 * Hide specific columns
 * @param {os.data.ColumnDefinition} colDef
 */
os.fields.hideSpecialColumns = function(colDef) {
  var field = colDef['field'];
  // hide units columns and any other columns we are creating derived columns from
  if (field == os.Fields.ALT_UNITS || field == os.Fields.SEMI_MINOR_UNITS ||
      field == os.Fields.SEMI_MAJOR_UNITS || field == os.Fields.BEARING ||
      field == os.Fields.BEARING || field == os.Fields.ALT ||
      field == os.Fields.SEMI_MINOR || field == os.Fields.SEMI_MAJOR) {
    colDef['visible'] = false;
  }
};


/**
 * mark a column as derived
 * @param {os.data.ColumnDefinition} colDef
 */
os.fields.markDerived = function(colDef) {
  var field = colDef['field'];
  if (field == os.fields.DEFAULT_SEMI_MAJ_COL_NAME) {
    colDef['toolTip'] = 'Derived Column';
    colDef['derivedFrom'] = os.Fields.SEMI_MAJOR;
  } else if (field == os.fields.DEFAULT_SEMI_MIN_COL_NAME) {
    colDef['toolTip'] = 'Derived Column';
    colDef['derivedFrom'] = os.Fields.SEMI_MINOR;
  } else if (field == os.fields.DEFAULT_ALT_COL_NAME) {
    colDef['toolTip'] = 'Derived Column';
    colDef['derivedFrom'] = os.Fields.ALT;
  }
};
