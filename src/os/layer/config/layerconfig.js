goog.declareModuleId('os.layer.config');

import ColumnDefinition from '../../data/columndefinition.js';
import {autoSizeColumn} from '../../ui/slick/column.js';

const {default: FeatureTypeColumn} = goog.requireType('os.ogc.FeatureTypeColumn');


/**
 * @typedef {function():!Object<string, *>}
 */
export let DefaultFn;

/**
 * Layer config identifiers.
 * @enum {string}
 */
export const LayerConfigId = {
  STATIC: 'static'
};

/**
 * Map a feature type column to a column definition.
 *
 * @param {!FeatureTypeColumn} ftColumn The feature type column.
 * @return {!ColumnDefinition} The column definition.
 */
export const mapFeatureTypeColumn = function(ftColumn) {
  var name = ftColumn.name.toUpperCase();

  var columnDef = new ColumnDefinition();
  columnDef['id'] = name;
  columnDef['name'] = name;
  columnDef['field'] = ftColumn.name;
  columnDef['type'] = ftColumn.type;

  autoSizeColumn(columnDef);

  return columnDef;
};
