/* eslint-disable valid-jsdoc */

/**
 * Slick Grid
 *
 * @externs
 */


/**
 * Namespace.
 * @type {Object}
 * @const
 */
var Slick = {};

/**
 * @constructor
 */
Slick.EventData;

Slick.EventData.prototype.stopPropagation = function() {};

/**
 * @returns {boolean}
 */
Slick.EventData.prototype.isPropagationStopped = function() {};

Slick.EventData.prototype.stopImmediatePropagation = function() {};

/**
 * @return {boolean}
 */
Slick.EventData.prototype.isImmediatePropagationStopped = function() {};

/**
 * @template EvtType, ArgType
 * @constructor
 */
Slick.Event;

/**
 * @param {function(EvtType, ArgType)} handler
 */
Slick.Event.prototype.subscribe = function(handler) {};

/**
 * @param {function(EvtType, ArgType)} handler
 */
Slick.Event.prototype.unsubscribe = function(handler) {};


/** @type {Slick.Event<Slick.EventData, {node: Node, column: os.data.ColumnDefinition}>} */
Slick.Grid.prototype.onHeaderCellRendered;


/**
 * Namespace.
 * @type {Object}
 */
Slick.Editors = {};


/** @param {!Object} args */
Slick.Editors.Integer = function(args) {};


/** @param {!Object} args */
Slick.Editors.Text = function(args) {};


/**
 * @constructor
 */
Slick.EditorLock = function() {};


/**
 * @return {boolean}
 */
Slick.EditorLock.prototype.isActive = function() {};


/**
 *
 */
Slick.EditorLock.prototype.commitCurrentEdit = function() {};


/**
 * Namespace.
 * @type {Object}
 */
Slick.Plugins = {};



/**
 * @constructor
 * @param {Node|angular.JQLite} container
 * @param {Array|Slick.Data.DataView} data
 * @param {Array} columns
 * @param {Object} options
 */
Slick.Grid = function(container, data, columns, options) {};
Slick.Grid.prototype.debug = function() {};


/**
 * @param {number} idx The index of the row to scroll to.
 */
Slick.Grid.prototype.scrollRowToTop = function(idx) {};


/**
 * @param {number} row The index of the row to scroll to.
 * @param {number} column The index of the column to scroll to.
 * @param {boolean} doPaging No idea what this does.
 */
Slick.Grid.prototype.scrollCellIntoView = function(row, column, doPaging) {};


/**
 * @typedef {function(*, *):string}
 */
Slick.Grid.ValueExtractor;



/** @constructor */
function onScroll() {}


/** @type {onScroll} */
Slick.Grid.prototype.onScroll;


/**
 * @param {*} fn
 */
onScroll.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onScroll.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onScroll.prototype.notify = function(args, e, scope) {};



/** @constructor */
function onSort() {}


/** @type {onSort} */
Slick.Grid.prototype.onSort;


/**
 * @param {*} fn
 */
onSort.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onSort.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onSort.prototype.notify = function(args, e, scope) {};



/** @constructor */
function onHeaderContextMenu() {}


/** @type {onHeaderContextMenu} */
Slick.Grid.prototype.onHeaderContextMenu;


/**
 * @param {*} fn
 */
onHeaderContextMenu.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onHeaderContextMenu.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onHeaderContextMenu.prototype.notify = function(args, e, scope) {};



/** @constructor */
function onHeaderClick() {}


/** @type {onHeaderClick} */
Slick.Grid.prototype.onHeaderClick;


/**
 * @param {*} fn
 */
onHeaderClick.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onHeaderClick.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onHeaderClick.prototype.notify = function(args, e, scope) {};



/** @constructor */
function onMouseEnter() {}


/** @type {onMouseEnter} */
Slick.Grid.prototype.onMouseEnter;


/**
 * @param {*} fn
 */
onMouseEnter.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onMouseEnter.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onMouseEnter.prototype.notify = function(args, e, scope) {};



/** @constructor */
function onMouseLeave() {}


/** @type {onMouseLeave} */
Slick.Grid.prototype.onMouseLeave;


/**
 * @param {*} fn
 */
onMouseLeave.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onMouseLeave.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onMouseLeave.prototype.notify = function(args, e, scope) {};



/** @constructor */
function onClick() {}


/** @type {onClick} */
Slick.Grid.prototype.onClick;


/**
 * @param {*} fn
 */
onClick.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onClick.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onClick.prototype.notify = function(args, e, scope) {};



/** @constructor */
function onDblClick() {}


/** @type {onDblClick} */
Slick.Grid.prototype.onDblClick;


/**
 * @param {*} fn
 */
onDblClick.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onDblClick.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onDblClick.prototype.notify = function(args, e, scope) {};



/** @constructor */
function onContextMenu() {}


/** @type {onContextMenu} */
Slick.Grid.prototype.onContextMenu;


/**
 * @param {*} fn
 */
onContextMenu.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onContextMenu.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onContextMenu.prototype.notify = function(args, e, scope) {};



/** @constructor */
function onKeyDown() {}


/** @type {onKeyDown} */
Slick.Grid.prototype.onKeyDown;


/**
 * @param {*} fn
 */
onKeyDown.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onKeyDown.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onKeyDown.prototype.notify = function(args, e, scope) {};



/** @constructor */
function onAddNewRow() {}


/** @type {onAddNewRow} */
Slick.Grid.prototype.onAddNewRow;


/**
 * @param {*} fn
 */
onAddNewRow.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onAddNewRow.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onAddNewRow.prototype.notify = function(args, e, scope) {};



/** @constructor */
function onValidationError() {}


/** @type {onValidationError} */
Slick.Grid.prototype.onValidationError;


/**
 * @param {*} fn
 */
onValidationError.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onValidationError.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onValidationError.prototype.notify = function(args, e, scope) {};



/** @constructor */
function onViewportChanged() {}


/** @type {onViewportChanged} */
Slick.Grid.prototype.onViewportChanged;


/**
 * @param {*} fn
 */
onViewportChanged.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onViewportChanged.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onViewportChanged.prototype.notify = function(args, e, scope) {};



/** @constructor */
function onColumnsReordered() {}


/** @type {onColumnsReordered} */
Slick.Grid.prototype.onColumnsReordered;


/**
 * @param {*} fn
 */
onColumnsReordered.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onColumnsReordered.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onColumnsReordered.prototype.notify = function(args, e, scope) {};



/** @constructor */
function onColumnsResized() {}


/** @type {onColumnsResized} */
Slick.Grid.prototype.onColumnsResized;


/**
 * @param {*} fn
 */
onColumnsResized.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onColumnsResized.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onColumnsResized.prototype.notify = function(args, e, scope) {};


/**
 * @typedef {{
 *   row: number,
 *   cell: number
 *   }}
 */
Slick.Grid.Cell;



/** @constructor */
function onCellChange() {}


/** @type {onCellChange} */
Slick.Grid.prototype.onCellChange;


/**
 * @param {*} fn
 */
onCellChange.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onCellChange.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onCellChange.prototype.notify = function(args, e, scope) {};



/** @constructor */
function onBeforeEditCell() {}


/** @type {onBeforeEditCell} */
Slick.Grid.prototype.onBeforeEditCell;


/**
 * @param {*} fn
 */
onBeforeEditCell.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onBeforeEditCell.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onBeforeEditCell.prototype.notify = function(args, e, scope) {};



/** @constructor */
function onBeforeCellEditorDestroy() {}


/** @type {onBeforeCellEditorDestroy} */
Slick.Grid.prototype.onBeforeCellEditorDestroy;


/**
 * @param {*} fn
 */
onBeforeCellEditorDestroy.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onBeforeCellEditorDestroy.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onBeforeCellEditorDestroy.prototype.notify = function(args, e, scope) {};



/** @constructor */
function onBeforeDestroy() {}


/** @type {onBeforeDestroy} */
Slick.Grid.prototype.onBeforeDestroy;


/**
 * @param {*} fn
 */
onBeforeDestroy.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onBeforeDestroy.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onBeforeDestroy.prototype.notify = function(args, e, scope) {};



/** @constructor */
function onActiveCellChanged() {}


/** @type {onActiveCellChanged} */
Slick.Grid.prototype.onActiveCellChanged;


/**
 * @param {*} fn
 */
onActiveCellChanged.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onActiveCellChanged.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onActiveCellChanged.prototype.notify = function(args, e, scope) {};



/** @constructor */
function onActiveCellPositionChanged() {}


/** @type {onActiveCellPositionChanged} */
Slick.Grid.prototype.onActiveCellPositionChanged;


/**
 * @param {*} fn
 */
onActiveCellPositionChanged.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onActiveCellPositionChanged.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onActiveCellPositionChanged.prototype.notify = function(args, e, scope) {};



/** @constructor */
function onDragInit() {}


/** @type {onDragInit} */
Slick.Grid.prototype.onDragInit;


/**
 * @param {*} fn
 */
onDragInit.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onDragInit.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onDragInit.prototype.notify = function(args, e, scope) {};



/** @constructor */
function onDragStart() {}


/** @type {onDragStart} */
Slick.Grid.prototype.onDragStart;


/**
 * @param {*} fn
 */
onDragStart.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onDragStart.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onDragStart.prototype.notify = function(args, e, scope) {};



/** @constructor */
function onDrag() {}


/** @type {onDrag} */
Slick.Grid.prototype.onDrag;


/**
 * @param {*} fn
 */
onDrag.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onDrag.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onDrag.prototype.notify = function(args, e, scope) {};



/** @constructor */
function onDragEnd() {}


/** @type {onDragEnd} */
Slick.Grid.prototype.onDragEnd;


/**
 * @param {*} fn
 */
onDragEnd.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onDragEnd.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onDragEnd.prototype.notify = function(args, e, scope) {};



/** @constructor */
function onSelectedRowsChanged() {}


/** @type {onSelectedRowsChanged} */
Slick.Grid.prototype.onSelectedRowsChanged;


/**
 * @param {*} fn
 */
onSelectedRowsChanged.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onSelectedRowsChanged.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onSelectedRowsChanged.prototype.notify = function(args, e, scope) {};


/**
 * @param {*} plugin
 */
Slick.Grid.prototype.registerPlugin = function(plugin) {};


/**
 * @param {*} plugin
 */
Slick.Grid.prototype.unregisterPlugin = function(plugin) {};


/**
 * @return {Array}
 */
Slick.Grid.prototype.getColumns = function() {};


/**
 * @param {*} columnDefinitions
 */
Slick.Grid.prototype.setColumns = function(columnDefinitions) {};


/**
 * @return {!Array<string>}
 */
Slick.Grid.prototype.getSortColumns = function() {};


/**
 * @param {Array} columnDefinitions
 */
Slick.Grid.prototype.setSortColumns = function(columnDefinitions) {};


/**
 * @param {*} id
 * @return {*}
 */
Slick.Grid.prototype.getColumnIndex = function(id) {};


/**
 * @param {*} columnId
 * @param {*}  title
 * @param {*}  toolTip
 */
Slick.Grid.prototype.updateColumnHeader = function(columnId, title, toolTip) {};


/**
 * @param {*} columnId
 * @param {boolean=}  opt_ascending
 */
Slick.Grid.prototype.setSortColumn = function(columnId, opt_ascending) {};
Slick.Grid.prototype.autosizeColumns = function() {};


/**
 * @return {*}
 */
Slick.Grid.prototype.getOptions = function() {};


/**
 * @param {*} args
 */
Slick.Grid.prototype.setOptions = function(args) {};


/**
 * @return {*}
 */
Slick.Grid.prototype.getData = function() {};


/**
 * @return {*}
 */
Slick.Grid.prototype.getDataLength = function() {};


/**
 * @param {*} i
 * @return {*}
 */
Slick.Grid.prototype.getDataItem = function(i) {};


/**
 * @param {*} newData
 * @param {*} scrollToTop
 */
Slick.Grid.prototype.setData = function(newData, scrollToTop) {};


/**
 * @return {*}
 */
Slick.Grid.prototype.getSelectionModel = function() {};


/**
 * @param {*} model
 */
Slick.Grid.prototype.setSelectionModel = function(model) {};


/**
 * @return {*}
 */
Slick.Grid.prototype.getSelectedRows = function() {};


/**
 * @param {*} rows
 */
Slick.Grid.prototype.setSelectedRows = function(rows) {};
Slick.Grid.prototype.render = function() {};
Slick.Grid.prototype.invalidate = function() {};


/**
 * @param {*} row
 */
Slick.Grid.prototype.invalidateRow = function(row) {};


/**
 * @param {*} rows
 */
Slick.Grid.prototype.invalidateRows = function(rows) {};
Slick.Grid.prototype.invalidateAllRows = function() {};


/**
 * @param {*} row
 * @param {*} cell
 */
Slick.Grid.prototype.updateCell = function(row, cell) {};


/**
 * @param {*} row
 */
Slick.Grid.prototype.updateRow = function(row) {};


/**
 * @param {*} viewportTop
 * @return {*}
 */
Slick.Grid.prototype.getViewport = function(viewportTop) {};
Slick.Grid.prototype.resizeCanvas = function() {};
Slick.Grid.prototype.updateRowCount = function() {};


/**
 * @param {*} row
 * @param {*}  doPaging
 */
Slick.Grid.prototype.scrollRowIntoView = function(row, doPaging) {};


/**
 * @return {!Node}
 */
Slick.Grid.prototype.getCanvasNode = function() {};


/**
 * @param {*} x
 * @param {*} y
 * @return {Slick.Grid.Cell}
 */
Slick.Grid.prototype.getCellFromPoint = function(x, y) {};


/**
 * @param {*} e
 * @return {Slick.Grid.Cell}
 */
Slick.Grid.prototype.getCellFromEvent = function(e) {};


/**
 * @return {*}
 */
Slick.Grid.prototype.getActiveCell = function() {};


/**
 * @param {*} row
 * @param {*}  cell
 */
Slick.Grid.prototype.setActiveCell = function(row, cell) {};


/**
 * @return {*}
 */
Slick.Grid.prototype.getActiveCellNode = function() {};


/**
 * @return {*}
 */
Slick.Grid.prototype.getActiveCellPosition = function() {};
Slick.Grid.prototype.resetActiveCell = function() {};


/**
 * @param {*} editor
 */
Slick.Grid.prototype.editActiveCell = function(editor) {};


/**
 * @return {*}
 */
Slick.Grid.prototype.getCellEditor = function() {};


/**
 * @param {number} row
 * @param {number} cell
 * @return {Element}
 */
Slick.Grid.prototype.getCellNode = function(row, cell) {};


/**
 * @param {*} row
 * @param {Slick.Grid.Cell} cell
 * @return {*}
 */
Slick.Grid.prototype.getCellNodeBox = function(row, cell) {};


/**
 * @param {number} row
 * @return {Element}
 */
Slick.Grid.prototype.getRowNode = function(row) {};


/**
 * @param {*} row
 * @param {Slick.Grid.Cell}  cell
 * @return {boolean}
 */
Slick.Grid.prototype.canCellBeSelected = function(row, cell) {};


/**
 * @param {*} row
 * @param {*}  cell
 * @return {*}
 */
Slick.Grid.prototype.canCellBeActive = function(row, cell) {};
Slick.Grid.prototype.navigatePrev = function() {};
Slick.Grid.prototype.navigateNext = function() {};
Slick.Grid.prototype.navigateUp = function() {};
Slick.Grid.prototype.navigateDown = function() {};
Slick.Grid.prototype.navigateLeft = function() {};
Slick.Grid.prototype.navigateRight = function() {};


/**
 * @param {*} row
 * @param {*}  cell
 * @param {*}  forceEdit
 */
Slick.Grid.prototype.gotoCell = function(row, cell, forceEdit) {};


/**
 * @return {*}
 */
Slick.Grid.prototype.getTopPanel = function() {};
Slick.Grid.prototype.showTopPanel = function() {};
Slick.Grid.prototype.hideTopPanel = function() {};
Slick.Grid.prototype.showHeaderRowColumns = function() {};
Slick.Grid.prototype.hideHeaderRowColumns = function() {};


/**
 * @return {Element}
 */
Slick.Grid.prototype.getHeaderRow = function() {};


/**
 * @param {*} columnId
 * @return {Element}
 */
Slick.Grid.prototype.getHeaderRowColumn = function(columnId) {};


/**
 * @return {*}
 */
Slick.Grid.prototype.getGridPosition = function() {};


/**
 * @param {*} row
 * @param {*}  cell
 * @param {*}  speed
 */
Slick.Grid.prototype.flashCell = function(row, cell, speed) {};


/**
 * @param {*} key
 * @param {*} hash
 */
Slick.Grid.prototype.addCellCssStyles = function(key, hash) {};


/**
 * @param {*} key
 * @param {*} hash
 */
Slick.Grid.prototype.setCellCssStyles = function(key, hash) {};


/**
 * @param {*} key
 */
Slick.Grid.prototype.removeCellCssStyles = function(key) {};
Slick.Grid.prototype.destroy = function() {};


/**
 * @return {!Slick.EditorLock}
 */
Slick.Grid.prototype.getEditorLock = function() {};


/**
 * @return {*}
 */
Slick.Grid.prototype.getEditController = function() {};


/**
 * Slick.Data.DataView
 */


/** namespace */
Slick.Data = {};



/**
 * @constructor
 * @param {Object=} opt_options Optional slick grid DataView options.
 */
Slick.Data.DataView = function(opt_options) {};
Slick.Data.DataView.prototype.beginUpdate = function() {};


/**
 * @param {!Slick.Grid} grid
 * @param {boolean} preserveHidden
 */
Slick.Data.DataView.prototype.syncGridSelection = function(grid, preserveHidden) {};


/**
 * @param {*=} hints
 */
Slick.Data.DataView.prototype.endUpdate = function(hints) {};


/** */
Slick.Data.DataView.prototype.destroy = function() {};


/**
 * @param {*} args
 */
Slick.Data.DataView.prototype.setPagingOptions = function(args) {};


/**
 * @return {*}
 */
Slick.Data.DataView.prototype.getPagingInfo = function() {};


/**
 * @return {!Array}
 */
Slick.Data.DataView.prototype.getItems = function() {};


/**
 * @param {Array.<Object>} items The items to set in this data view.
 * @param {string=} objectIdProperty The ID property name .
 */
Slick.Data.DataView.prototype.setItems = function(items, objectIdProperty) {};


/**
 * @param {*} filterFn
 */
Slick.Data.DataView.prototype.setFilter = function(filterFn) {};


/**
 * @param {*} comparer
 * @param {*=} opt_ascending
 */
Slick.Data.DataView.prototype.sort = function(comparer, opt_ascending) {};


/**
 * @param {*} field
 * @param {*}  ascending
 * @return {*}
 */
Slick.Data.DataView.prototype.fastSort = function(field, ascending) {};
Slick.Data.DataView.prototype.reSort = function() {};


/**
 * @param {*} valueGetter
 * @param {*}  valueFormatter
 * @param {*}  sortComparer
 */
Slick.Data.DataView.prototype.groupBy = function(valueGetter, valueFormatter, sortComparer) {};


/**
 * @param {*} groupAggregators
 * @param {*}  includeCollapsed
 */
Slick.Data.DataView.prototype.setAggregators = function(groupAggregators, includeCollapsed) {};


/**
 * @param {*} groupingValue
 */
Slick.Data.DataView.prototype.collapseGroup = function(groupingValue) {};


/**
 * @param {*} groupingValue
 */
Slick.Data.DataView.prototype.expandGroup = function(groupingValue) {};


/**
 * @return {*}
 */
Slick.Data.DataView.prototype.getGroups = function() {};


/**
 * @param {*} id
 * @return {*}
 */
Slick.Data.DataView.prototype.getIdxById = function(id) {};


/**
 * @param {*} id
 * @return {number}
 */
Slick.Data.DataView.prototype.getRowById = function(id) {};


/**
 * @param {*} id
 * @return {*}
 */
Slick.Data.DataView.prototype.getItemById = function(id) {};


/**
 * @param {*} i
 * @return {*}
 */
Slick.Data.DataView.prototype.getItemByIdx = function(i) {};
Slick.Data.DataView.prototype.refresh = function() {};


/**
 * @param {*} id
 * @param {*}  item
 */
Slick.Data.DataView.prototype.updateItem = function(id, item) {};


/**
 * @param {*} insertBefore
 * @param {*}  item
 */
Slick.Data.DataView.prototype.insertItem = function(insertBefore, item) {};


/**
 * @param {*} item
 */
Slick.Data.DataView.prototype.addItem = function(item) {};


/**
 * @param {*} id
 */
Slick.Data.DataView.prototype.deleteItem = function(id) {};


/**
 * @return {number}
 */
Slick.Data.DataView.prototype.getLength = function() {};


/**
 * @param {*} i
 * @return {!Object}
 */
Slick.Data.DataView.prototype.getItem = function(i) {};


/**
 * @param {number} i
 * @return {Object}
 */
Slick.Data.DataView.prototype.getItemMetadata = function(i) {};


/**
 * @param {Array<number>} i
 * @return {Array<number>}
 */
Slick.Data.DataView.prototype.mapIdsToRows = function(i) {};


/**
 * @param {Array<number>} i
 * @return {Array<number>}
 */
Slick.Data.DataView.prototype.mapRowsToIds = function(i) {};



/** @constructor */
function onRowCountChanged() {}


/** @type {onRowCountChanged} */
Slick.Data.DataView.prototype.onRowCountChanged;


/**
 * @param {*} fn
 */
onRowCountChanged.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onRowCountChanged.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onRowCountChanged.prototype.notify = function(args, e, scope) {};



/** @constructor */
function onRowsChanged() {}


/** @type {onRowsChanged} */
Slick.Data.DataView.prototype.onRowsChanged;


/**
 * @param {*} fn
 */
onRowsChanged.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onRowsChanged.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onRowsChanged.prototype.notify = function(args, e, scope) {};



/** @constructor */
function onPagingInfoChanged() {}


/** @type {onPagingInfoChanged} */
Slick.Data.DataView.prototype.onPagingInfoChanged;


/**
 * @param {*} fn
 */
onPagingInfoChanged.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onPagingInfoChanged.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onPagingInfoChanged.prototype.notify = function(args, e, scope) {};



/** @constructor */
function onRowRender() {}


/** @type {onRowRender} */
Slick.Grid.prototype.onRowRender;


/**
 * @param {*} fn
 */
onRowRender.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onRowRender.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*} e
 * @param {*} scope
 * @return {*}
 */
onRowRender.prototype.notify = function(args, e, scope) {};






/** @constructor */
function onRowRenderComplete() {}


/** @type {onRowRenderComplete} */
Slick.Grid.prototype.onRowRenderComplete;


/**
 * @param {*} fn
 */
onRowRenderComplete.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onRowRenderComplete.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*} e
 * @param {*} scope
 * @return {*}
 */
onRowRenderComplete.prototype.notify = function(args, e, scope) {};


/** @constructor */
function onRowRemove() {}


/** @type {onRowRemove} */
Slick.Grid.prototype.onRowRemove;


/**
 * @param {*} fn
 */
onRowRemove.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onRowRemove.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*} e
 * @param {*} scope
 * @return {*}
 */
onRowRemove.prototype.notify = function(args, e, scope) {};


/**
 * Slick.RowSelectionModel
 */


/**
 * @constructor
 * @param {Object=} options
 */
Slick.RowSelectionModel = function(options) {};


/**
 * @return {*}
 */
Slick.RowSelectionModel.prototype.getSelectedRows = function() {};


/**
 * @param {*} rows
 */
Slick.RowSelectionModel.prototype.setSelectedRows = function(rows) {};


/**
 * @return {*}
 */
Slick.RowSelectionModel.prototype.getSelectedRanges = function() {};


/**
 * @param {*} ranges
 */
Slick.RowSelectionModel.prototype.setSelectedRanges = function(ranges) {};


/**
 * @param {*} grid
 */
Slick.RowSelectionModel.prototype.init = function(grid) {};
Slick.RowSelectionModel.prototype.destroy = function() {};



/** @constructor */
function onSelectedRangesChanged() {}


/** @type {onSelectedRangesChanged} */
Slick.RowSelectionModel.prototype.onSelectedRangesChanged;


/**
 * @param {*} fn
 */
onSelectedRangesChanged.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onSelectedRangesChanged.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onSelectedRangesChanged.prototype.notify = function(args, e, scope) {};


/**
 * Slick.RowMoveManager
 */


/** @constructor */
Slick.RowMoveManager = function() {};



/** @constructor */
function onBeforeMoveRows() {}


/** @type {onBeforeMoveRows} */
Slick.RowMoveManager.prototype.onBeforeMoveRows;


/**
 * @param {*} fn
 */
onBeforeMoveRows.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onBeforeMoveRows.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onBeforeMoveRows.prototype.notify = function(args, e, scope) {};



/** @constructor */
function onMoveRows() {}


/** @type {onBeforeMoveRows} */
Slick.RowMoveManager.prototype.onMoveRows;


/**
 * @param {*} fn
 */
onMoveRows.prototype.subscribe = function(fn) {};


/**
 * @param {*} fn
 */
onMoveRows.prototype.unsubscribe = function(fn) {};


/**
 * @param {*} args
 * @param {*}  e
 * @param {*}  scope
 * @return {*}
 */
onMoveRows.prototype.notify = function(args, e, scope) {};


/**
 * Slick.RowMoveManager
 */


/**
 * @constructor
 */
Slick.Plugins.HeaderButtons = function() {};


/**
 * @param {*} grid
 */
Slick.Plugins.prototype.init = function(grid) {};


/**  */
Slick.Plugins.prototype.destroy = function() {};


/**
 * @param {*} e
 * @param {*} args
 */
Slick.Plugins.prototype.handleHeaderCellRendered = function(e, args) {};


/**
 * @param {*} e
 * @param {*} args
 */
Slick.Plugins.prototype.handleBeforeHeaderCellDestroy = function(e, args) {};


/**
 * @param {*} e
 */
Slick.Plugins.prototype.handleButtonClick = function(e) {};


/** */
Slick.Plugins.onCommand;
