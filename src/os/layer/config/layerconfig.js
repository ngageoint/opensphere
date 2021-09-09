goog.module('os.layer.config');

const ColumnDefinition = goog.require('os.data.ColumnDefinition');
const {autoSizeColumn} = goog.require('os.ui.slick.column');

const FeatureTypeColumn = goog.requireType('os.ogc.FeatureTypeColumn');

/**
 * @typedef {function():!Object<string, *>}
 */
let DefaultFn;

/**
 * Layer config identifiers.
 * @enum {string}
 */
const LayerConfigId = {
  STATIC: 'static'
};

/**
 * Map a feature type column to a column definition.
 *
 * @param {!FeatureTypeColumn} ftColumn The feature type column.
 * @return {!ColumnDefinition} The column definition.
 */
const mapFeatureTypeColumn = function(ftColumn) {
  var name = ftColumn.name.toUpperCase();

  var columnDef = new ColumnDefinition();
  columnDef['id'] = name;
  columnDef['name'] = name;
  columnDef['field'] = ftColumn.name;
  columnDef['type'] = ftColumn.type;

  autoSizeColumn(columnDef);

  return columnDef;
};

exports = {
  DefaultFn,
  mapFeatureTypeColumn,
  LayerConfigId
};
