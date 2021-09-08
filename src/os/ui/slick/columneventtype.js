goog.module('os.ui.slick.ColumnEventType');

/**
 * @enum {string}
 */
exports = {
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
