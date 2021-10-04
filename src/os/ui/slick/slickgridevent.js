goog.declareModuleId('os.ui.slick.SlickGridEvent');

/**
 * Angular events used by the slickgrid directive.
 * @enum {string}
 */
const SlickGridEvent = {
  BEFORE_CELL_EDITED: 'slickgrid.beforeCellEdited',
  CELL_CHANGED: 'slickgrid.cellChanged',
  CELL_EDITOR_DESTROYED: 'slickgrid.cellEditorDestroyed',
  COMMIT_EDIT: 'slickgrid.commitEdit',
  COPY_ROWS: 'slickgrid.copyRows',
  HIGHLIGHT_CHANGE: 'slickgrid.highlightChange',
  INVALIDATE_ROWS: 'slickgrid.invalidateRows',
  INVALIDATE_COLUMNS: 'slickgrid.invalidateColumns',
  ORDER_CHANGE: 'slickgrid.orderChange',
  REFRESH_DATA: 'slickgrid.refreshData',
  SELECTION_CHANGE: 'slickgrid.selectionChange',
  SCROLL_TO: 'slickgrid.scrollToItem',
  SCROLL_TO_CELL: 'slickgrid.scrollToCell',
  SORT_SELECTED: 'slickgrid.sortSelected',
  SORT_CHANGED: 'slickgrid.sortChanged'
};

export default SlickGridEvent;
