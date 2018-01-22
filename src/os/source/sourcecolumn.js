goog.provide('os.source.column');

goog.require('goog.string');
goog.require('os.Fields');
goog.require('os.data.ColumnDefinition');
goog.require('os.data.RecordField');
goog.require('os.geo');
goog.require('os.im.mapping.RadiusMapping');
goog.require('os.im.mapping.SemiMajorMapping');
goog.require('os.im.mapping.SemiMinorMapping');
goog.require('os.ui.formatter.DescriptionFormatter');
goog.require('os.ui.formatter.PropertiesFormatter');
goog.require('os.ui.slick.column');


/**
 * Create a column for a data source.
 * @param {string} field The data field for the column.
 * @param {string=} opt_header Optional header. If not specified, field will be used instead.
 * @param {boolean=} opt_temp Optional flag for temp columns. Defaults to false.
 * @return {!os.data.ColumnDefinition} The column definition.
 */
os.source.column.create = function(field, opt_header, opt_temp) {
  var header = opt_header || field;
  var columnDef = new os.data.ColumnDefinition(header, field);
  columnDef['sortable'] = true;
  columnDef['temp'] = opt_temp || false;

  os.ui.slick.column.autoSizeColumn(columnDef);

  return columnDef;
};


/**
 * Map a feature type column to a column definition.
 * @param {!(os.data.ColumnDefinition|string)} column The column name or definition.
 * @return {!os.data.ColumnDefinition} The column definition.
 */
os.source.column.mapStringOrDef = function(column) {
  return typeof column === 'string' ? os.source.column.create(column) : column;
};


/**
 * Add custom formatters to source columns.
 * @param {!os.data.ColumnDefinition} column The column definition.
 */
os.source.column.addFormatter = function(column) {
  var field = column['field'];
  if (field) {
    if (field.indexOf(os.Fields.PROPERTIES) > -1) {
      // properties columns generally contain object values and should be formatted differently
      column['formatter'] = os.ui.formatter.PropertiesFormatter;
    }

    if (os.fields.DESC_REGEXP.test(field)) {
      // description columns generally contain more information than is feasible to show in a grid
      column['formatter'] = os.ui.formatter.DescriptionFormatter;
    }
  }
};


/**
 * Add application default columns to a vector source.
 * @param {!os.source.Vector} source The vector source.
 */
os.source.column.addDefaults = function(source) {
  var hasID = false;
  var hasMGRS = false;
  var hasLAT = false;
  var hasLON = false;
  var hasLATDMS = false;
  var hasLONDMS = false;
  var hasTIME = false;
  var hasALT = false;
  var hasRadius = false;
  var hasSemiMajor = false;
  var hasSemiMinor = false;

  // test for each column type
  source.getColumns().forEach(function(column) {
    var name = column['name'];
    if (name) {
      hasID |= goog.string.caseInsensitiveEquals(name, os.Fields.ID);
      hasLATDMS |= goog.string.caseInsensitiveEquals(name, os.Fields.LAT_DMS);
      hasLONDMS |= goog.string.caseInsensitiveEquals(name, os.Fields.LON_DMS);
      hasLAT |= goog.string.caseInsensitiveEquals(name, os.Fields.LAT);
      hasLON |= goog.string.caseInsensitiveEquals(name, os.Fields.LON);
      hasMGRS |= os.geo.MGRSRegExp.test(name);
      hasTIME |= goog.string.caseInsensitiveEquals(name, os.data.RecordField.TIME);
    }

    var field = column['field'];
    if (field) {
      hasALT |= os.geo.ALT_REGEXP.test(field);
      hasRadius |= os.im.mapping.RadiusMapping.REGEX.test(field);
      hasSemiMajor |= os.im.mapping.SemiMajorMapping.REGEX.test(field);
      hasSemiMinor |= os.im.mapping.SemiMinorMapping.REGEX.test(field);
    }
  });

  // add missing default columns
  if (!hasMGRS && hasLAT && hasLON) {
    source.addColumn(os.Fields.MGRS);
  }

  if (!hasLATDMS && hasLAT) {
    source.addColumn(os.Fields.LAT_DMS);
  }

  if (!hasLONDMS && hasLON) {
    source.addColumn(os.Fields.LON_DMS);
  }

  if (!hasTIME && source.getTimeEnabled()) {
    source.addColumn(os.data.RecordField.TIME, os.Fields.TIME);
  }

  if (hasALT) {
    source.addColumn(os.fields.DEFAULT_ALT_COL_NAME);
    source.addColumn(os.Fields.ALT_UNITS);
  }

  if (hasRadius) {
    source.addColumn(os.Fields.RADIUS);
  }

  if (hasSemiMajor) {
    source.addColumn(os.fields.DEFAULT_SEMI_MAJ_COL_NAME);
  }

  if (hasSemiMinor) {
    source.addColumn(os.fields.DEFAULT_SEMI_MIN_COL_NAME);
  }

  if (!hasID) {
    source.addColumn(os.Fields.ID);
  }
};
