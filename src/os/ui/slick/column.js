goog.provide('os.ui.slick.ColumnContext');
goog.provide('os.ui.slick.ColumnEventType');
goog.provide('os.ui.slick.column');

goog.require('goog.array');
goog.require('os.data.ColumnDefinition');
goog.require('os.ui');
goog.require('os.ui.action.Action');
goog.require('os.ui.action.ActionEvent');
goog.require('os.ui.action.ActionManager');
goog.require('os.ui.action.MenuOptions');
goog.require('os.ui.slick.formatter');


/**
 * @const
 */
os.ui.slick.column.FIX_CELL = 'ui-widget';


/**
 * @const
 */
os.ui.slick.column.FIX_HEADER = 'ui-widget ui-state-default';


/**
 * Initial column width/order settings.
 * @type {Object.<string, Object>}
 */
os.ui.slick.column.fix = {
  'TIME': {
    order: -95,
    width: os.ui.measureText('0000-00-00 00:00:00Z', os.ui.slick.column.FIX_CELL).width + 10
  },
  'MGRS': {
    order: -90,
    width: os.ui.measureText('00WWW0000000000', os.ui.slick.column.FIX_CELL).width + 10
  },
  'LAT_DMS': {
    order: -85,
    width: os.ui.measureText('00° 00\' 00.00" N', os.ui.slick.column.FIX_CELL).width + 10
  },
  'LON_DMS': {
    order: -84,
    width: os.ui.measureText('000° 00\' 00.00" W', os.ui.slick.column.FIX_CELL).width + 10
  },
  'LAT': {
    order: -83,
    width: os.ui.measureText('-00.000000', os.ui.slick.column.FIX_CELL).width + 10
  },
  'LON': {
    order: -82,
    width: os.ui.measureText('-000.000000', os.ui.slick.column.FIX_CELL).width + 10
  },
  'ALTITUDE': {
    order: -81,
    width: os.ui.measureText('-000000.000', os.ui.slick.column.FIX_CELL).width + 10
  },
  'SEMI_MAJOR': {
    order: -80,
    width: Math.max(
        os.ui.measureText('-000.000000', os.ui.slick.column.FIX_CELL).width,
        os.ui.measureText('SEMI_MAJOR', os.ui.slick.column.FIX_HEADER).width + 20)
  },
  'SEMI_MINOR': {
    order: -79,
    width: Math.max(
        os.ui.measureText('-000.000000', os.ui.slick.column.FIX_CELL).width,
        os.ui.measureText('SEMI_MINOR', os.ui.slick.column.FIX_HEADER).width + 20)
  },
  'ORIENTATION': {
    order: -78,
    width: Math.max(
        os.ui.measureText('-000.000000', os.ui.slick.column.FIX_CELL).width,
        os.ui.measureText('ORIENTATION', os.ui.slick.column.FIX_HEADER).width + 20)
  },
  'Name': {
    order: -60
  }
};


/**
 * Automatically sizes a column based on fixed widths or the column name.
 * @param {os.data.ColumnDefinition} column
 */
os.ui.slick.column.autoSizeColumn = function(column) {
  var opt_header = column['header'] ? 20 : 0;
  if (!column['width']) {
    var fixOptions = os.ui.slick.column.fix[column['name']];
    if (fixOptions && fixOptions.width) {
      column['width'] = fixOptions.width + opt_header;
    } else {
      column['width'] = Math.max(80, os.ui.measureText(column['name']).width + opt_header + 20);
    }
  }
};


/**
 * Sorts columns
 * @param {os.data.ColumnDefinition} a
 * @param {os.data.ColumnDefinition} b
 * @return {number}
 */
os.ui.slick.column.autoSizeAndSortColumns = function(a, b) {
  os.ui.slick.column.autoSizeColumn(a);
  os.ui.slick.column.autoSizeColumn(b);

  var ac = os.ui.slick.column.fix[a['name']];
  var bc = os.ui.slick.column.fix[b['name']];

  // if these are undefined, check if we are dealing with derived columns
  // and look up the original column names and orders
  if (!ac) {
    ac = os.ui.slick.column.fix[a['derivedFrom']];
  }

  if (!bc) {
    bc = os.ui.slick.column.fix[b['derivedFrom']];
  }

  var ao = ac ? ac.order : 0;
  var bo = bc ? bc.order : 0;

  return goog.array.defaultCompare(ao, bo);
};


/**
 * @param {os.data.ColumnDefinition} a
 * @param {os.data.ColumnDefinition} b
 * @return {number}
 */
os.ui.slick.column.nameCompare = function(a, b) {
  return goog.array.defaultCompare(a['name'], b['name']);
};


/**
 * @param {os.data.ColumnDefinition} a
 * @param {os.data.ColumnDefinition} b
 * @return {number}
 */
os.ui.slick.column.numerateNameCompare = function(a, b) {
  return goog.string.numerateCompare(a['name'], b['name']);
};


/**
 * Id used by color columns.
 * @type {string}
 * @const
 */
os.ui.slick.column.COLOR_ID = '_color';


/**
 * Creates a column to display color. The column's value should be a hex or rgba color string.
 * @return {os.data.ColumnDefinition} The color column
 */
os.ui.slick.column.color = function() {
  var column = new os.data.ColumnDefinition();
  column['id'] = os.ui.slick.column.COLOR_ID;
  column['field'] = 'COLOR';
  column['internal'] = true;
  column['focusable'] = false;
  column['cssClass'] = 'color';
  column['formatter'] = os.ui.slick.formatter.color;
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
 * Creates a new column action manager
 * @return {os.ui.action.ActionManager} The column action manager
 */
os.ui.slick.createColumnActions = function() {
  var manager = new os.ui.action.ActionManager();

  var manageColumns = new os.ui.action.Action(os.ui.slick.ColumnEventType.MANAGE, 'Manage Columns',
      'Display a window where you can manage your columns', 'fa-columns', null,
      new os.ui.action.MenuOptions(null, os.ui.slick.ColumnGroupType.ORDER, 0));
  manager.addAction(manageColumns);

  var first = new os.ui.action.Action(os.ui.slick.ColumnEventType.FIRST, 'First',
      'Move the column to the beginning', 'fa-angle-double-left', null,
      new os.ui.action.MenuOptions(null, os.ui.slick.ColumnGroupType.ORDER, 1));
  first.enableWhen(os.ui.slick.column.hasColumn_);
  manager.addAction(first);

  var last = new os.ui.action.Action(os.ui.slick.ColumnEventType.LAST, 'Last',
      'Move the column to the end', 'fa-angle-double-right', null,
      new os.ui.action.MenuOptions(null, os.ui.slick.ColumnGroupType.ORDER, 4));
  last.enableWhen(os.ui.slick.column.hasColumn_);
  manager.addAction(last);

  var remove = new os.ui.action.Action(os.ui.slick.ColumnEventType.REMOVE, 'Hide Column',
      'Removes the column from the grid', 'fa-eye-slash', null,
      new os.ui.action.MenuOptions(null, os.ui.slick.ColumnGroupType.EDIT, 1))
      .enableWhen(os.ui.slick.column.checkColumnRemove_);
  manager.addAction(remove);

  var resetColumns = new os.ui.action.Action(os.ui.slick.ColumnEventType.RESET, 'Reset Columns',
      'Show all columns and reset their widths', 'fa-refresh', null,
      new os.ui.action.MenuOptions(null, os.ui.slick.ColumnGroupType.EDIT, 2));
  manager.addAction(resetColumns);

  return manager;
};


/**
 * @typedef {{
 *   columns: Array.<os.data.ColumnDefinition>,
 *   column: os.data.ColumnDefinition,
 *   grid: os.ui.slick.SlickGridCtrl
 * }}
 */
os.ui.slick.ColumnContext;


/**
 * Default groups in the list menu.
 * @enum {string}
 */
os.ui.slick.ColumnGroupType = {
  ORDER: '0:Column Order',
  EDIT: '1:Edit Columns'
};


/**
 * @enum {string}
 */
os.ui.slick.ColumnEventType = {
  CONTEXTMENU: 'column:contextMenu',

  // manager
  MANAGE: 'column:manageColumns',

  // column order
  FIRST: 'column:moveColumnToBeginning',
  LAST: 'column:moveColumnToEnd',

  // visibility
  ADD: 'column:addColumn',
  REMOVE: 'column:removeColumn',
  HIDE_EMPTY: 'column:hideEmpty',
  SHOW_ALL: 'column:showAll',
  RESET: 'column:resetColumns'
};


/**
 * Checks whether a column is provided in the action arguments.
 * @param {os.ui.slick.ColumnContext} actionArgs
 * @return {boolean}
 * @private
 */
os.ui.slick.column.hasColumn_ = function(actionArgs) {
  return actionArgs != null && actionArgs.column != null;
};


/**
 * Checks whether the column remove action should be enabled. If it finds more than 1 visible column,
 * the remove action will be available.
 * @param {os.ui.slick.ColumnContext} actionArgs
 * @return {boolean}
 * @private
 */
os.ui.slick.column.checkColumnRemove_ = function(actionArgs) {
  var count = 0;
  if (actionArgs && actionArgs.column && actionArgs.columns) {
    var columns = /** @type {Array.<os.data.ColumnDefinition>} */ (actionArgs.columns);
    for (var i = 0; i < columns.length; i++) {
      if (columns[i].visible) {
        count++;
        if (count > 1) {
          return true;
        }
      }
    }
  }

  return false;
};


/**
 * Find a column by field/name.
 * @param {Array<!os.data.ColumnDefinition>} columns
 * @param {string} fieldOrName The column field or name value.
 * @return {os.data.ColumnDefinition}
 */
os.ui.slick.column.findColumn = function(columns, fieldOrName) {
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
 * @param {string} key
 * @param {*} value
 * @param {os.data.ColumnDefinition} column
 * @param {number} index
 * @param {Array.<os.data.ColumnDefinition>} array
 * @return {boolean}
 */
os.ui.slick.column.findByField = function(key, value, column, index, array) {
  return column[key] == value;
};


/**
 * Sort columns by the specified field. Inject the field using goog.bind.
 * @param {string} field
 * @param {os.data.ColumnDefinition} a
 * @param {os.data.ColumnDefinition} b
 * @return {number}
 */
os.ui.slick.column.sortByField = function(field, a, b) {
  return a[field] == b[field] || a[field] > b[field] ? 1 : -1;
};


/**
 * If a column has been modified by the user.
 * @param {os.data.ColumnDefinition} column The column.
 * @return {number}
 */
os.ui.slick.column.isUserModified = function(column) {
  return column['userModified'];
};


/**
 * Restore a set of columns from another set.
 * @param {!Array<!os.data.ColumnDefinition>} from The source columns.
 * @param {!Array<!os.data.ColumnDefinition>} to The destination columns.
 */
os.ui.slick.column.restore = function(from, to) {
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
      return goog.array.defaultCompare(fa.index, fb.index);
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
