goog.module('os.source.column');

const {caseInsensitiveEquals} = goog.require('goog.string');
const Fields = goog.require('os.Fields');
const ColumnDefinition = goog.require('os.data.ColumnDefinition');
const RecordField = goog.require('os.data.RecordField');
const {
  DEFAULT_ALT_COL_NAME,
  DEFAULT_RADIUS_COL_NAME,
  DEFAULT_SEMI_MAJ_COL_NAME,
  DEFAULT_SEMI_MIN_COL_NAME,
  DESC_REGEXP
} = goog.require('os.fields');
const {ALT_REGEXP, MGRSRegExp} = goog.require('os.geo');
const RadiusMapping = goog.require('os.im.mapping.RadiusMapping');
const SemiMajorMapping = goog.require('os.im.mapping.SemiMajorMapping');
const SemiMinorMapping = goog.require('os.im.mapping.SemiMinorMapping');
const {default: DescriptionFormatter} = goog.require('os.ui.formatter.DescriptionFormatter');
const {default: PropertiesFormatter} = goog.require('os.ui.formatter.PropertiesFormatter');
const {autoSizeColumn} = goog.require('os.ui.slick.column');

const VectorSource = goog.requireType('os.source.Vector');


/**
 * Create a column for a data source.
 *
 * @param {string} field The data field for the column.
 * @param {string=} opt_header Optional header. If not specified, field will be used instead.
 * @param {boolean=} opt_temp Optional flag for temp columns. Defaults to false.
 * @return {!ColumnDefinition} The column definition.
 */
const create = function(field, opt_header, opt_temp) {
  var header = opt_header || field;
  var columnDef = new ColumnDefinition(header, field);
  columnDef['sortable'] = true;
  columnDef['temp'] = opt_temp || false;

  autoSizeColumn(columnDef);

  return columnDef;
};

/**
 * Map a feature type column to a column definition.
 *
 * @param {!(ColumnDefinition|string)} column The column name or definition.
 * @return {!ColumnDefinition} The column definition.
 */
const mapStringOrDef = function(column) {
  return typeof column === 'string' ? create(column) : column;
};

/**
 * Add custom formatters to source columns.
 *
 * @param {!ColumnDefinition} column The column definition.
 */
const addFormatter = function(column) {
  var field = column['field'];
  if (field) {
    if (field.indexOf(Fields.PROPERTIES) > -1) {
      // properties columns generally contain object values and should be formatted differently
      column['formatter'] = PropertiesFormatter;
    }

    if (DESC_REGEXP.test(field)) {
      // description columns generally contain more information than is feasible to show in a grid
      column['formatter'] = DescriptionFormatter;
    }
  }
};

/**
 * Add application default columns to a vector source.
 *
 * @param {!VectorSource} source The vector source.
 */
const addDefaults = function(source) {
  var hasID = false;
  var hasMGRS = false;
  var hasLAT = false;
  var hasLON = false;
  var hasLATDDM = false;
  var hasLONDDM = false;
  var hasLATDMS = false;
  var hasLONDMS = false;
  var hasTIME = false;
  var hasALT = false;
  var hasRadius = false;
  var hasSemiMajor = false;
  var hasSemiMinor = false;

  // test for each column type
  source.getColumnsArray().forEach(function(column) {
    var name = column['name'];
    if (name) {
      hasID |= caseInsensitiveEquals(name, Fields.ID);
      hasLATDDM |= caseInsensitiveEquals(name, Fields.LAT_DDM);
      hasLONDDM |= caseInsensitiveEquals(name, Fields.LON_DDM);
      hasLATDMS |= caseInsensitiveEquals(name, Fields.LAT_DMS);
      hasLONDMS |= caseInsensitiveEquals(name, Fields.LON_DMS);
      hasLAT |= caseInsensitiveEquals(name, Fields.LAT);
      hasLON |= caseInsensitiveEquals(name, Fields.LON);
      hasMGRS |= MGRSRegExp.test(name);
      hasTIME |= caseInsensitiveEquals(name, RecordField.TIME);
    }

    var field = column['field'];
    if (field) {
      hasALT |= ALT_REGEXP.test(field);
      hasRadius |= RadiusMapping.REGEX.test(field);
      hasSemiMajor |= SemiMajorMapping.REGEX.test(field);
      hasSemiMinor |= SemiMinorMapping.REGEX.test(field);
    }
  });

  // add missing default columns
  if (!hasMGRS && hasLAT && hasLON) {
    source.addColumn(Fields.MGRS);
  }

  if (!hasLATDMS && hasLAT) {
    source.addColumn(Fields.LAT_DMS);
  }

  if (!hasLONDMS && hasLON) {
    source.addColumn(Fields.LON_DMS);
  }

  if (!hasLATDDM && hasLAT) {
    source.addColumn(Fields.LAT_DDM);
  }

  if (!hasLONDDM && hasLON) {
    source.addColumn(Fields.LON_DDM);
  }

  if (!hasTIME && source.getTimeEnabled()) {
    source.addColumn(RecordField.TIME, Fields.TIME);
  }

  if (hasALT) {
    source.addColumn(DEFAULT_ALT_COL_NAME);
    source.addColumn(Fields.ALT_UNITS);
  }

  if (hasRadius) {
    source.addColumn(DEFAULT_RADIUS_COL_NAME);
  }

  if (hasSemiMajor) {
    source.addColumn(DEFAULT_SEMI_MAJ_COL_NAME);
  }

  if (hasSemiMinor) {
    source.addColumn(DEFAULT_SEMI_MIN_COL_NAME);
  }

  if (!hasID) {
    source.addColumn(Fields.ID);
  }
};

exports = {
  create,
  mapStringOrDef,
  addFormatter,
  addDefaults
};
