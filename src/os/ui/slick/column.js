goog.provide('os.ui.slick.ColumnContext');
goog.provide('os.ui.slick.ColumnEventType');
goog.provide('os.ui.slick.column');

goog.require('goog.array');
goog.require('os.data.ColumnDefinition');
goog.require('os.ui');
goog.require('os.ui.menu.Menu');
goog.require('os.ui.menu.MenuItem');
goog.require('os.ui.menu.MenuItemType');
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
 * @type {Object<string, Object>}
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
 * Creates a new column menu instance.
 * @return {!os.ui.menu.Menu<os.ui.slick.ColumnContext>} The column menu.
 */
os.ui.slick.createColumnActions = function() {
  return new os.ui.menu.Menu(new os.ui.menu.MenuItem({
    type: os.ui.menu.MenuItemType.ROOT,
    children: [{
      label: os.ui.slick.ColumnMenuGroup.ORDER,
      type: os.ui.menu.MenuItemType.GROUP,
      sort: 0,
      children: [{
        label: 'Manage Columns',
        eventType: os.ui.slick.ColumnEventType.MANAGE,
        tooltip: 'Display a window where you can manage your columns',
        icons: ['<i class="fa fa-fw fa-columns"></i>'],
        sort: 0
      },
      {
        label: 'First',
        eventType: os.ui.slick.ColumnEventType.FIRST,
        tooltip: 'Move the column to the beginning',
        icons: ['<i class="fa fa-fw fa-angle-double-left"></i>'],
        beforeRender: os.ui.slick.column.visibleIfHasColumn_,
        sort: 1
      },
      {
        label: 'Last',
        eventType: os.ui.slick.ColumnEventType.LAST,
        tooltip: 'Move the column to the end',
        icons: ['<i class="fa fa-fw fa-angle-double-right"></i>'],
        beforeRender: os.ui.slick.column.visibleIfHasColumn_,
        sort: 2
      }]
    }, {
      label: os.ui.slick.ColumnMenuGroup.EDIT,
      type: os.ui.menu.MenuItemType.GROUP,
      sort: 1,
      children: [{
        label: 'Hide Column',
        eventType: os.ui.slick.ColumnEventType.REMOVE,
        tooltip: 'Removes the column from the grid',
        icons: ['<i class="fa fa-fw fa-eye-slash"></i>'],
        beforeRender: os.ui.slick.column.visibleIfCanRemove_,
        sort: 0
      },
      {
        label: 'Reset Columns',
        eventType: os.ui.slick.ColumnEventType.RESET,
        tooltip: 'Show all columns and reset their widths',
        icons: ['<i class="fa fa-fw fa-refresh"></i>'],
        sort: 100
      }]
    }]
  }));
};


/**
 * @typedef {{
 *   columns: Array<os.data.ColumnDefinition>,
 *   column: os.data.ColumnDefinition,
 *   grid: os.ui.slick.SlickGridCtrl
 * }}
 */
os.ui.slick.ColumnContext;


/**
 * Default groups in the column menu.
 * @enum {string}
 */
os.ui.slick.ColumnMenuGroup = {
  ORDER: 'Column Order',
  EDIT: 'Edit Columns'
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
 * Show a menu item if the context has a column.
 * @param {os.ui.slick.ColumnContext} context The column menu context.
 * @this {os.ui.menu.MenuItem}
 * @private
 */
os.ui.slick.column.visibleIfHasColumn_ = function(context) {
  this.visible = !!context && !!context.column;
};


/**
 * Show a menu item if the context contains more than one visible column.
 * @param {os.ui.slick.ColumnContext} context The column menu context.
 * @this {os.ui.menu.MenuItem}
 * @private
 */
os.ui.slick.column.visibleIfCanRemove_ = function(context) {
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
 * @param {Array<os.data.ColumnDefinition>} array
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
