goog.declareModuleId('os.ui.slick.column');

import ColumnDefinition from '../../data/columndefinition.js';
import Menu from '../menu/menu.js';
import MenuItem from '../menu/menuitem.js';
import MenuItemType from '../menu/menuitemtype.js';
import {measureText} from '../ui.js';
import ColumnEventType from './columneventtype.js';
import ColumnMenuGroup from './columnmenugroup.js';
import {color as formatterColor} from './formatter.js';

const {defaultCompare} = goog.require('goog.array');
const {numerateCompare} = goog.require('goog.string');

const {default: ColumnContext} = goog.requireType('os.ui.slick.ColumnContext');


/**
 * @type {string}
 */
export const FIX_CELL = 'ui-widget';

/**
 * @type {string}
 */
export const FIX_HEADER = 'ui-widget ui-state-default';

/**
 * Initial column width/order settings.
 * @type {!Object<string, !Object>}
 */
export const fix = {
  'TIME': {
    order: -95,
    width: measureText('0000-00-00 00:00:00Z', FIX_CELL).width + 10
  },
  'MGRS': {
    order: -90,
    width: measureText('00WWW0000000000', FIX_CELL).width + 10
  },
  'LAT_DMS': {
    order: -85,
    width: measureText('00° 00\' 00.00" N', FIX_CELL).width + 10
  },
  'LON_DMS': {
    order: -84,
    width: measureText('000° 00\' 00.00" W', FIX_CELL).width + 10
  },
  'LAT': {
    order: -83,
    width: measureText('-00.000000', FIX_CELL).width + 10
  },
  'LON': {
    order: -82,
    width: measureText('-000.000000', FIX_CELL).width + 10
  },
  'LAT_DDM': {
    order: -81,
    width: measureText('00° 00.00\' N', FIX_CELL).width + 10
  },
  'LON_DDM': {
    order: -80,
    width: measureText('000° 00.00\' W', FIX_CELL).width + 10
  },
  'ALTITUDE': {
    order: -79,
    width: measureText('-000000.000', FIX_CELL).width + 10
  },
  'SEMI_MAJOR': {
    order: -78,
    width: Math.max(
        measureText('-000.000000', FIX_CELL).width,
        measureText('SEMI_MAJOR', FIX_HEADER).width + 20)
  },
  'SEMI_MINOR': {
    order: -77,
    width: Math.max(
        measureText('-000.000000', FIX_CELL).width,
        measureText('SEMI_MINOR', FIX_HEADER).width + 20)
  },
  'ORIENTATION': {
    order: -76,
    width: Math.max(
        measureText('-000.000000', FIX_CELL).width,
        measureText('ORIENTATION', FIX_HEADER).width + 20)
  },
  'Name': {
    order: -60
  }
};

/**
 * Automatically sizes a column based on fixed widths or the column name.
 *
 * @param {ColumnDefinition} column
 */
export const autoSizeColumn = function(column) {
  var opt_header = column['header'] ? 20 : 0;
  if (!column['width']) {
    var fixOptions = fix[column['name']];
    if (fixOptions && fixOptions.width) {
      column['width'] = fixOptions.width + opt_header;
    } else {
      column['width'] = Math.max(80, measureText(column['name']).width + opt_header + 20);
    }
  }
};

/**
 * Sorts columns
 *
 * @param {ColumnDefinition} a
 * @param {ColumnDefinition} b
 * @return {number}
 */
export const autoSizeAndSortColumns = function(a, b) {
  autoSizeColumn(a);
  autoSizeColumn(b);

  var ac = fix[a['name']];
  var bc = fix[b['name']];

  // if these are undefined, check if we are dealing with derived columns
  // and look up the original column names and orders
  if (!ac) {
    ac = fix[a['derivedFrom']];
  }

  if (!bc) {
    bc = fix[b['derivedFrom']];
  }

  var ao = ac ? ac.order : 0;
  var bo = bc ? bc.order : 0;

  return defaultCompare(ao, bo);
};

/**
 * @param {ColumnDefinition} a
 * @param {ColumnDefinition} b
 * @return {number}
 */
export const nameCompare = function(a, b) {
  return defaultCompare(a['name'], b['name']);
};

/**
 * @param {ColumnDefinition} a
 * @param {ColumnDefinition} b
 * @return {number}
 */
export const numerateNameCompare = function(a, b) {
  return numerateCompare(a['name'], b['name']);
};

/**
 * Id used by color columns.
 * @type {string}
 */
export const COLOR_ID = '_color';

/**
 * Creates a column to display color. The column's value should be a hex or rgba color string.
 *
 * @return {ColumnDefinition} The color column
 */
export const color = function() {
  var column = new ColumnDefinition();
  column['id'] = COLOR_ID;
  column['field'] = 'COLOR';
  column['internal'] = true;
  column['focusable'] = false;
  column['cssClass'] = 'color';
  column['formatter'] = formatterColor;
  column['resizable'] = false;
  column['selectable'] = false;
  column['sortable'] = false;
  column['visible'] = true;
  column['width'] = 20;
  column['minWidth'] = 20;
  column['maxWidth'] = 20;

  return column;
};

/**
 * Creates a new column menu instance.
 *
 * @return {!Menu<ColumnContext>} The column menu.
 */
export const createColumnActions = function() {
  return new Menu(new MenuItem({
    type: MenuItemType.ROOT,
    children: [{
      label: ColumnMenuGroup.ORDER,
      type: MenuItemType.GROUP,
      sort: 0,
      children: [{
        label: 'Manage Columns',
        eventType: ColumnEventType.MANAGE,
        tooltip: 'Display a window where you can manage your columns',
        icons: ['<i class="fa fa-fw fa-columns"></i>'],
        sort: 0
      },
      {
        label: 'First',
        eventType: ColumnEventType.FIRST,
        tooltip: 'Move the column to the beginning',
        icons: ['<i class="fa fa-fw fa-angle-double-left"></i>'],
        beforeRender: visibleIfHasColumn,
        sort: 1
      },
      {
        label: 'Last',
        eventType: ColumnEventType.LAST,
        tooltip: 'Move the column to the end',
        icons: ['<i class="fa fa-fw fa-angle-double-right"></i>'],
        beforeRender: visibleIfHasColumn,
        sort: 2
      }]
    }, {
      label: ColumnMenuGroup.EDIT,
      type: MenuItemType.GROUP,
      sort: 1,
      children: [{
        label: 'Hide Column',
        eventType: ColumnEventType.REMOVE,
        tooltip: 'Removes the column from the grid',
        icons: ['<i class="fa fa-fw fa-eye-slash"></i>'],
        beforeRender: visibleIfCanRemove,
        sort: 0
      },
      {
        label: 'Reset Columns',
        eventType: ColumnEventType.RESET,
        tooltip: 'Show all columns and reset their widths',
        icons: ['<i class="fa fa-fw fa-refresh"></i>'],
        sort: 100
      }]
    }]
  }));
};

/**
 * Show a menu item if the context has a column.
 *
 * @param {ColumnContext} context The column menu context.
 * @this {MenuItem}
 */
export const visibleIfHasColumn = function(context) {
  this.visible = !!context && !!context.column;
};

/**
 * Show a menu item if the context contains more than one visible column.
 *
 * @param {ColumnContext} context The column menu context.
 * @this {MenuItem}
 */
export const visibleIfCanRemove = function(context) {
  this.visible = false;

  var foundOne = false;
  if (context && context.column && context.columns) {
    for (var i = 0; i < context.columns.length; i++) {
      if (context.columns[i].visible) {
        if (foundOne) {
          this.visible = true;
          return;
        } else {
          foundOne = true;
        }
      }
    }
  }
};

/**
 * Find a column by field/name.
 *
 * @param {Array<!ColumnDefinition>} columns
 * @param {string} fieldOrName The column field or name value.
 * @return {ColumnDefinition}
 */
export const findColumn = function(columns, fieldOrName) {
  var column = null;
  for (var i = 0, n = columns.length; i < n; i++) {
    if (columns[i]['field'] == fieldOrName || columns[i]['name'] == fieldOrName) {
      column = columns[i];
      break;
    }
  }

  return column;
};

/**
 * Find a column by the specified key/value. Inject the field using goog.bind.
 *
 * @param {string} key
 * @param {*} value
 * @param {ColumnDefinition} column
 * @param {number} index
 * @param {Array<ColumnDefinition>} array
 * @return {boolean}
 */
export const findByField = function(key, value, column, index, array) {
  return column[key] == value;
};

/**
 * Sort columns by the specified field. Inject the field using goog.bind.
 *
 * @param {string} field
 * @param {ColumnDefinition} a
 * @param {ColumnDefinition} b
 * @return {number}
 */
export const sortByField = function(field, a, b) {
  return a[field] == b[field] || a[field] > b[field] ? 1 : -1;
};

/**
 * If a column has been modified by the user.
 *
 * @param {ColumnDefinition} column The column.
 * @return {number}
 */
export const isUserModified = function(column) {
  return column['userModified'];
};

/**
 * Restore a set of columns from another set.
 *
 * @param {!Array<!ColumnDefinition>} from The source columns.
 * @param {!Array<!ColumnDefinition>} to The destination columns.
 */
export const restore = function(from, to) {
  var fromMap = {};
  from.forEach(function(column, idx, arr) {
    fromMap[column['name']] = {
      column: column,
      index: idx
    };
  });

  to.forEach(function(column, idx, arr) {
    var fc = fromMap[column['name']];
    if (fc) {
      column.restore(fc.column);
    }
  });

  // sort any columns in the target list in the same order as the source list, and leave all other columns at the end
  // of the array in their current order.
  to.sort(function(a, b) {
    var fa = fromMap[a['name']];
    var fb = fromMap[b['name']];

    if (fa && fb) {
      // both columns are in the descriptor list, sort against their index
      return defaultCompare(fa.index, fb.index);
    } else if (fa) {
      // only a was on the descriptor, sort it left
      return -1;
    } else if (fb) {
      // only b was on the descriptor, sort it left
      return 1;
    }

    // neither were on the descriptor, don't change their order
    return 0;
  });
};

/**
 * Mapper function for columns to their fields.
 *
 * @param {ColumnDefinition} column The column.
 * @return {string}
 */
export const mapField = function(column) {
  return column['field'];
};
