goog.declareModuleId('os.ui.slick.SlickGridUI');

import AlertEventSeverity from '../../alert/alerteventseverity.js';
import AlertManager from '../../alert/alertmanager.js';
import {killRightButton} from '../../events/events.js';
import {filterFalsey} from '../../fn/fn.js';
import osImplements from '../../implements.js';
import {FLOAT} from '../../string/string.js';
import ActionManager from '../action/actionmanager.js';
import {launchColumnManager} from '../column/column.js';
import {openMenu} from '../globalmenu.js';
import IMenuSupplier from '../menu/imenusupplier.js';
import Menu from '../menu/menu.js';
import Module from '../module.js';
import ResizeEventType from '../resizeeventtype.js';
import {copy} from '../text/text.js';
import * as ui from '../ui.js';
import windowSelector from '../windowselector.js';
import {createColumnActions, findByField} from './column.js';
import ColumnEventType from './columneventtype.js';
import SlickGridEvent from './slickgridevent.js';

const Disposable = goog.require('goog.Disposable');
const Timer = goog.require('goog.Timer');
const {defaultCompare, insert, moveItem} = goog.require('goog.array');
const Delay = goog.require('goog.async.Delay');
const nextTick = goog.require('goog.async.nextTick');
const dispose = goog.require('goog.dispose');
const {getAncestorByClass} = goog.require('goog.dom');
const {contains} = goog.require('goog.dom.classlist');
const {listen, unlisten} = goog.require('goog.events');
const BrowserEvent = goog.require('goog.events.BrowserEvent');
const GoogEventType = goog.require('goog.events.EventType');
const KeyCodes = goog.require('goog.events.KeyCodes');
const {createSet} = goog.require('goog.object');
const {makeSafe} = goog.require('goog.string');

const GoogEvent = goog.requireType('goog.events.Event');
const EventLike = goog.requireType('goog.events.EventLike');
const {default: IComparable} = goog.requireType('os.IComparable');
const {default: ColumnDefinition} = goog.requireType('os.data.ColumnDefinition');
const {default: MenuEvent} = goog.requireType('os.ui.menu.MenuEvent');
const {default: ColumnContext} = goog.requireType('os.ui.slick.ColumnContext');


/**
 * The slick grid directive.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  template: '<div class="slick-grid"></div>',
  scope: {
    'data': '=',
    'columns': '=',
    'options': '=',
    'contextMenu': '&',
    'columnMenuEnabled': '@',
    'dblClickEnabled': '@',
    'dblClickHandler': '=?',
    'dragEnabled': '=',
    'resizeWith': '@',
    'idField': '@',
    'disableSelection': '@',
    'selected': '=?',
    'useAngular': '@',
    'defaultSortColumn': '@',
    'defaultSortOrder': '@', /* asc|desc */
    'compare': '=?',
    'getItemMetadata': '=?',
    'rowScope': '=?',
    'cellTooltips': '=?'
  },
  controller: Controller,
  controllerAs: 'gridCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'slickgrid';

/**
 * Add the directive to the ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for SlickGrid directive
 * @unrestricted
 */
export class Controller extends Disposable {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$compile} $compile
   * @ngInject
   */
  constructor($scope, $element, $compile) {
    super();

    // disable animation on slickgrids as it is an enormous performance killer with our Angular integration
    try {
      var $animate = /** @type {angular.$animate} */ (ui.injector.get('$animate'));
      $animate.enabled($element, false);
    } catch (e) {
      // animate service not available, we don't really care
    }

    /**
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * @type {?angular.JQLite}
     * @protected
     */
    this.element = $element;

    /**
     * @type {?angular.$compile}
     * @protected
     */
    this.compile = $compile;

    /**
     * @type {Array}
     * @protected
     */
    this.destroyers = [];

    /**
     * @type {boolean}
     * @protected
     */
    this.dragging = false;

    /**
     * @type {Function}
     * @protected
     */
    this.resizeFn = this.resize.bind(this);

    /**
     * This smooths out resizing components containing slickgrids by delaying the grid resize until the component stops
     * resizing.
     * @type {Delay}
     * @protected
     */
    this.resizeDelay = new Delay(this.doResize, 50, this);

    /**
     * Maximum number of characters that may be copied to the clipboard.
     * @type {number}
     * @protected
     */
    this.copyLimit = 100000;

    /**
     * Message to display when the user tries copying too much data to the clipboard.
     * @type {string}
     * @protected
     */
    this.copyLimitMsg = Controller.COPY_LIMIT_MSG;

    // The order in which these watches are created matters. Any initial selection state on a slickgrid will be wiped
    // out if the watch on columns is created before the watch on the selected items.
    this.destroyers.push($scope.$watch('data', this.onDataChange.bind(this)));
    this.destroyers.push($scope.$watch('selected', this.onSelectedChange.bind(this)));
    this.destroyers.push($scope.$watch('columns', this.onColumnsChange.bind(this)));
    this.destroyers.push($scope.$watch('options', this.onOptionsChange.bind(this)));
    this.destroyers.push($scope.$on('$destroy', this.dispose.bind(this)));
    var unWatchSortColumn = $scope.$watch('defaultSortColumn', function(newVal) {
      if (newVal && $scope['columns'].find(function(col) {
        return newVal == col['id'];
      })) {
        setTimeout(function() {
          unWatchSortColumn();
          if (this.grid) {
            this.grid.setSortColumn(newVal, this.scope['defaultSortOrder'] !== 'desc');
            this.onSortChange();
          }
        }.bind(this), 100);
      }
    }.bind(this));

    /**
     * The column menu.
     * @type {Menu<ColumnContext>}
     * @protected
     */
    this.columnMenu = ($scope['columnMenuEnabled'] && $scope['columnMenuEnabled'] !== 'false') ?
      createColumnActions() : null;

    /**
     * @type {Slick.Data.DataView}
     * @protected
     */
    this.dataView = new Slick.Data.DataView();
    if ($scope['getItemMetadata'] !== undefined) {
      this.dataView.getItemMetadata = $scope['getItemMetadata'];
    }

    var options = this.getOptions();
    /**
     * @type {Slick.Grid}
     */
    this.grid = new Slick.Grid($element, this.dataView, this.getColumns(), options);

    this.dataView.onRowCountChanged.subscribe(this.onRowCountChanged.bind(this));
    this.dataView.onRowsChanged.subscribe(this.onRowsChanged_.bind(this));

    this.grid.onClick.subscribe(this.onItemClick.bind(this));
    this.grid.onKeyDown.subscribe(this.onUserInteraction.bind(this));
    this.grid.onSelectedRowsChanged.subscribe(this.onGridSelectedChange.bind(this));
    this.grid.onSort.subscribe(this.onSortChange.bind(this));
    this.grid.onColumnsReordered.subscribe(this.onColumnsReordered_.bind(this));
    this.grid.onColumnsResized.subscribe(this.onColumnsResized_.bind(this));
    this.grid.onMouseEnter.subscribe(this.onMouseEnter.bind(this));
    this.grid.onMouseLeave.subscribe(this.onMouseLeave.bind(this));

    // row render/remove bindings for angular compilation
    if ($scope['useAngular']) {
      this.grid.onRowRender.subscribe(this.onRowRender.bind(this));
      this.grid.onRowRemove.subscribe(this.onRowRemove.bind(this));
      this.grid.onActiveCellChanged.subscribe(this.apply.bind(this));
    }

    var selectable = !$scope['disableSelection'];
    this.selectionModel_ = selectable ? new Slick.RowSelectionModel() : null;

    if (this.selectionModel_) {
      // this was intentionally moved after the click handler so our handler gets called first
      this.grid.setSelectionModel(this.selectionModel_);
      this.dataView.syncGridSelection(this.grid, false);
    }

    if (options['editable']) {
      // editable grids have additional CSS styles. add the class to enable them.
      this.element.addClass('editable');

      this.grid.onCellChange.subscribe(this.cellChanged.bind(this));
      this.grid.onBeforeEditCell.subscribe(this.beforeCellEdited.bind(this));
      this.grid.onBeforeCellEditorDestroy.subscribe(this.cellEditorDestroyed.bind(this));

      this.scope.$on(SlickGridEvent.REFRESH_DATA, this.refreshDataView.bind(this));
      this.scope.$on(SlickGridEvent.COMMIT_EDIT, this.onCommitEdit.bind(this));
    }

    $scope.$on(SlickGridEvent.INVALIDATE_ROWS, this.invalidateRows.bind(this));
    $scope.$on(SlickGridEvent.INVALIDATE_COLUMNS, this.invalidateColumns.bind(this));
    $scope.$on(SlickGridEvent.COPY_ROWS, this.onCopyRows.bind(this));
    $scope.$on(SlickGridEvent.SCROLL_TO, this.onScrollToItem.bind(this));
    $scope.$on(SlickGridEvent.SCROLL_TO_CELL, this.onScrollToCell.bind(this));
    $scope.$on(SlickGridEvent.SORT_SELECTED, this.onSortBySelectionChange.bind(this));
    $scope.$on('resize', this.resizeFn);
    $scope.$on(ResizeEventType.UPDATE_RESIZE, this.onUpdateResize.bind(this));

    $scope['cellTooltips'] = $scope['cellTooltips'] == undefined ? true : $scope['cellTooltips'];

    if ($scope['dblClickEnabled'] && $scope['dblClickEnabled'] !== 'false') {
      if ($scope['dblClickHandler'] != null) {
        this.grid.onDblClick.subscribe($scope['dblClickHandler'].bind(this));
      } else {
        this.grid.onDblClick.subscribe(this.onDblClick.bind(this));
      }
    }

    this.onDragInitFn_ = this.onDragInit.bind(this);
    this.onDragStartFn_ = this.onDragStart.bind(this);
    this.onDragFn_ = this.onDrag.bind(this);
    this.onDragEndFn_ = this.onDragEnd.bind(this);

    /**
     * @type {?Timer}
     * @protected
     */
    this.scrollTimer = null;

    /**
     * @type {number}
     * @private
     */
    this.magnitude_ = 0;

    if ($scope['dragEnabled']) {
      this.onDragEnabledChange_(true);
    }

    $scope.$watch('dragEnabled', this.onDragEnabledChange_.bind(this));

    /**
     * @type {?angular.JQLite}
     * @private
     */
    this.container_ = null;

    if ($scope['resizeWith']) {
      this.container_ = $element.parents($scope['resizeWith']);
      ui.resize(this.container_, this.resizeFn);
    } else {
      // call the resize handler when the root element resizes
      ui.resize(this.element, this.resizeFn);
    }

    /**
     * @type {ActionManager|Menu|undefined}
     * @private
     */
    this.contextMenu_ = undefined;

    var contextMenu = $scope['contextMenu'] && $scope['contextMenu']();
    this.setContextMenu(contextMenu || undefined);

    var viewport = this.element.find('.slick-viewport');
    listen(viewport[0], GoogEventType.CONTEXTMENU, this.onContextMenu_, false, this);
    listen(viewport[0], GoogEventType.MOUSEDOWN, killRightButton, true);
    listen(viewport[0], GoogEventType.MOUSEUP, killRightButton, true);

    this.scope.$on(GoogEventType.CONTEXTMENU, this.onContextMenu_.bind(this));

    if (this.columnMenu) {
      this.columnMenu.listen(ColumnEventType.REMOVE, this.onColumnRemove, false, this);
      this.columnMenu.listen(ColumnEventType.RESET, this.onColumnReset, false, this);
      this.columnMenu.listen(ColumnEventType.FIRST, this.onColumnFirst, false, this);
      this.columnMenu.listen(ColumnEventType.LAST, this.onColumnLast, false, this);
      this.columnMenu.listen(ColumnEventType.MANAGE, this.onColumnManager, false, this);

      var headerRow = this.element.find('.slick-header');
      listen(headerRow[0], GoogEventType.CONTEXTMENU, this.onHeaderContextMenu_, false, this);

      $scope.$on(ColumnEventType.MANAGE, this.onColumnManager.bind(this));
      $scope.$on(ColumnEventType.CONTEXTMENU, this.onHeaderContextMenu_.bind(this));
    }

    /**
     * @type {boolean}
     * @protected
     */
    this.inEvent = false;

    /**
     * Track when we're in a user click handler.
     * @type {boolean}
     * @protected
     */
    this.inInteraction = false;

    /**
     * If the value extractor for slickgrid should be used by sort.
     * @type {boolean}
     * @protected
     */
    this.useExtractorInSort = true;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    if (this.element) {
      var headerRow = this.element.find('.slick-header');
      unlisten(headerRow[0], GoogEventType.CONTEXTMENU, this.onHeaderContextMenu_, false, this);

      var viewport = this.element.find('.slick-viewport');
      unlisten(viewport[0], GoogEventType.CONTEXTMENU, this.onContextMenu_, false, this);
      unlisten(viewport[0], GoogEventType.MOUSEDOWN, killRightButton, true);
      unlisten(viewport[0], GoogEventType.MOUSEUP, killRightButton, true);
    }

    dispose(this.columnMenu);
    this.columnMenu = null;

    for (var i = 0, n = this.destroyers.length; i < n; i++) {
      this.destroyers[i]();
    }
    this.destroyers.length = 0;

    dispose(this.resizeDelay);

    if (this.container_) {
      ui.removeResize(this.container_, this.resizeFn);
      this.container_ = null;
    } else {
      ui.removeResize(this.element, this.resizeFn);
    }

    if (this.selectionModel_) {
      this.selectionModel_.destroy();
      this.selectionModel_ = null;
    }

    if (this.scrollTimer) {
      this.scrollTimer.dispose();
    }

    if (this.dataView) {
      this.dataView.setItems([]);
    }

    if (this.grid) {
      this.grid.invalidateAllRows();
      this.grid.destroy();
    }

    this.grid = null;
    this.dataView = null;

    this.contextMenu_ = undefined;
    this.element = null;

    this.scope['data'] = null;
    this.scope = null;
  }

  /**
   * @param  {boolean} newValue
   * @param  {boolean=} opt_oldValue
   * @private
   */
  onDragEnabledChange_(newValue, opt_oldValue) {
    if (newValue != opt_oldValue) {
      if (newValue) {
        this.grid.onDragInit.subscribe(this.onDragInitFn_);
        this.grid.onDragStart.subscribe(this.onDragStartFn_);
        this.grid.onDrag.subscribe(this.onDragFn_);
        this.grid.onDragEnd.subscribe(this.onDragEndFn_);

        this.scrollTimer = new Timer(20);
        this.magnitude_ = 0;

        var viewport = this.element.find('.slick-viewport');
        this.scrollTimer.listen(Timer.TICK, () => {
          viewport.scrollTop(viewport.scrollTop() - this.magnitude_);
        }, false);

        this.element.addClass('dragdrop');
      } else {
        this.grid.onDragInit.unsubscribe(this.onDragInitFn_);
        this.grid.onDragStart.unsubscribe(this.onDragStartFn_);
        this.grid.onDrag.unsubscribe(this.onDragFn_);
        this.grid.onDragEnd.unsubscribe(this.onDragEndFn_);

        if (this.scrollTimer) {
          this.scrollTimer.dispose();
        }

        this.element.removeClass('dragdrop');
      }
    }
  }

  /**
   * Gets the options for the grid
   *
   * @return {Object<string, *>} the options
   * @protected
   */
  getOptions() {
    var defaults = defaultOptions;

    if (this.scope['options']) {
      var o = Object.assign({}, defaults);
      Object.assign(o, this.scope['options']);
      return o;
    }

    return defaults;
  }

  /**
   * Gets the columns for the grid, trimming out any that have been hidden.
   *
   * @return {!Array}
   * @protected
   */
  getColumns() {
    return this.getColumnsInternal().filter(this.isColumnVisible, this);
  }

  /**
   * Get columns for the base slick grid.
   *
   * @return {!Array<ColumnDefinition>}
   * @protected
   */
  getColumnsInternal() {
    return this.scope['columns'] || [];
  }

  /**
   * Get the column menu for this grid.
   *
   * @return {Menu<ColumnContext>}
   */
  getColumnMenu() {
    return this.columnMenu;
  }

  /**
   * Tests if the column is visible. Visibility defaults to false if the 'visible' field is not on the column.
   *
   * @param {ColumnDefinition} column
   * @return {boolean} If the provided column is visible
   * @protected
   */
  isColumnVisible(column) {
    return !('visible' in column) || column['visible'];
  }

  /**
   * Gets the data for the grid
   *
   * @return {!Array}
   * @protected
   */
  getData() {
    return this.scope['data'] || [];
  }

  /**
   * Gets the data in the grid, sorted by the Slickgrid data view.
   *
   * @return {!Array}
   * @protected
   */
  getViewData() {
    return this.dataView ? this.dataView.getItems() : [];
  }

  /**
   * Gets selected data in the grid, sorted by the Slickgrid data view.
   *
   * @return {!Array}
   * @protected
   */
  getSelectedViewData() {
    var selected;
    var rows = this.getSelectedRows();
    if (rows && rows.length) {
      // sort the selected rows, so items match the order in the view
      rows = rows.slice().sort(defaultCompare);

      // map rows to data items and filter out falsey values
      selected = rows.map(function(row) {
        return this.dataView.getItemByIdx(row);
      }, this).filter(filterFalsey);
    }

    return selected || [];
  }

  /**
   * Gets selected data in the grid, sorted by the Slickgrid data view.
   *
   * @param {(function(*):string)=} opt_mapFn Function to map grid items to text.
   */
  copyRows(opt_mapFn) {
    var data = this.getSelectedViewData();
    if (data.length === 0) {
      data = this.getViewData();
    }

    var mapFn = opt_mapFn || makeSafe;
    var copyText = '';
    for (var i = 0; i < data.length; i++) {
      copyText += mapFn(data[i]) + '\n';

      if (copyText.length > this.copyLimit) {
        AlertManager.getInstance().sendAlert(this.copyLimitMsg, AlertEventSeverity.WARNING);
        copyText = undefined;
        break;
      }
    }

    if (copyText) {
      copy(copyText.trim());
    }
  }

  /**
   * Handles row changes
   *
   * @param {*} e The event
   * @param {Object} args The args
   * @private
   */
  onRowsChanged_(e, args) {
    if (!this.isDisposed()) {
      this.grid.invalidateRows(args['rows']);
      this.grid.render();
    }
  }

  /**
   * Handles row count changes
   *
   * @param {*} e The event
   * @param {Object} args The args
   * @protected
   */
  onRowCountChanged(e, args) {
    if (!this.isDisposed()) {
      this.grid.updateRowCount();

      // Calls to render break when there's an angular templateUrl inside a slick grid.  This alleviates the extraneous
      // calls to render upon initialization and allow them to work thereafter.
      if (this.isRowCountChangedReady_) {
        this.grid.render();
      } else {
        this.isRowCountChangedReady_ = true;
      }
    }
  }

  /**
   * Resizes the grid
   */
  resize() {
    this.resizeDelay.start();
  }

  /**
   * Resizes the grid
   *
   * @protected
   */
  doResize() {
    this.grid.resizeCanvas();

    var selected = this.getSelectedRows();
    if (selected && selected.length > 0) {
      this.grid.scrollRowIntoView(selected[0], false);
    }
  }

  /**
   * Handler for updating the resize listener. This is needed due to cases where the resize listener breaks.
   * @private
   */
  onUpdateResize() {
    ui.removeResize(this.element, this.resizeFn);
    ui.resize(this.element, this.resizeFn);
  }

  /**
   * Copies rows in the grid.
   *
   * @param {angular.Scope.Event} event
   * @param {function(*):string} mapFn Function to map grid items to text.
   * @protected
   */
  onCopyRows(event, mapFn) {
    if (typeof mapFn === 'function') {
      this.copyRows(mapFn);
    }
  }

  /**
   * Scrolls the grid to an item.
   *
   * @param {angular.Scope.Event} event
   * @param {*} item
   * @param {boolean=} opt_top If the item should be positioned at the top of the view
   * @protected
   */
  onScrollToItem(event, item, opt_top) {
    var row = this.mapItemsToRows(item);
    if (row !== undefined) {
      if (opt_top) {
        this.grid.scrollRowToTop(row);
      } else {
        this.grid.scrollRowIntoView(row, false);
      }
    }
  }

  /**
   * Handle scroll to cell events.
   *
   * @param {angular.Scope.Event} event
   * @param {number} row
   * @param {number} column
   * @protected
   */
  onScrollToCell(event, row, column) {
    this.scrollToCell(row, column);
  }

  /**
   * Scrolls the grid to a cell
   *
   * @param {number} row
   * @param {number} column
   */
  scrollToCell(row, column) {
    var maxRow = this.dataView.getItems().length - 1;
    row = Math.min(row || 0, maxRow || 0);

    var maxColumn = this.getColumns().length - 1;
    column = Math.min(column || 0, maxColumn || 0);

    this.grid.scrollCellIntoView(row, column, false);
  }

  /**
   * Handle mouse click events from Slickgrid.
   *
   * @param {MouseEvent} e The event
   * @param {Object} args The args
   * @protected
   */
  onItemClick(e, args) {
    this.onUserInteraction(e, args);
  }

  /**
   * Handle user interaction (click/key press) events from Slickgrid.
   *
   * @param {Event} e The event
   * @param {Object} args The args
   * @protected
   */
  onUserInteraction(e, args) {
    var code = e && e.keyCode || 0;
    if (code == KeyCodes.SHIFT || code == KeyCodes.ALT || code == KeyCodes.CTRL) {
      // ignore modifier keys on their own, because they may not interact with the grid
      return;
    }

    // keep track of when we're in a user interaction handler
    this.inInteraction = true;
    this.scope.$emit('userInteraction');

    // reset the user interaction flag as soon as the stack is cleared
    nextTick(() => {
      this.inInteraction = false;
    });
  }

  /**
   * Updates the data
   *
   * @param {Array} data
   */
  updateData(data) {
    this.grid.resetActiveCell();
    this.dataView.setItems(data, this.scope['idField'] || 'id');

    if (this.grid.getSortColumns().length) {
      this.onSortChange();
    }
  }

  /**
   * Handles data changes
   *
   * @param {Array=} opt_newVal
   * @param {Array=} opt_oldVal
   * @protected
   */
  onDataChange(opt_newVal, opt_oldVal) {
    this.updateData(this.getData());
  }

  /**
   * Handles column changes
   *
   * @param {Array<ColumnDefinition>=} opt_newVal
   * @param {Array<ColumnDefinition>=} opt_oldVal
   * @protected
   */
  onColumnsChange(opt_newVal, opt_oldVal) {
    if (!opt_newVal || this.getColumns() != opt_newVal) {
      if (this.grid) {
        this.grid.setColumns(this.getColumns());
        this.setSelectedRows(this.getSelectedRows());
      }
    }
  }

  /**
   * Called after user-driven changes to columns.
   *
   * @param {Array<ColumnDefinition>=} opt_changed The changed columns.
   * @protected
   */
  onUserColumnsChange(opt_changed) {
    if (opt_changed) {
      opt_changed.forEach(function(c) {
        c['userModified'] = true;
      });
    }

    this.onColumnsChange();
  }

  /**
   * Respond to column reorder events from slickgrid. These fire when the user moves columns via drag/drop.
   *
   * @param {*} e The event
   * @param {Object} args The args
   * @private
   */
  onColumnsReordered_(e, args) {
    if (!this.inEvent) {
      this.inEvent = true;

      var columns = this.grid.getColumns();
      var srcColumns = this.getColumnsInternal();
      var changed = [];
      for (var i = 0, j = 0, n = columns.length; i < n; i++, j++) {
        // skip internal columns that aren't on the original source
        while (columns[i]['internal']) {
          i++;
        }

        // the grid only has references to visible columns, so we need to account for that with the array indices.
        // this skips hidden columns in the source.
        while (j < srcColumns.length && !this.isColumnVisible(srcColumns[j])) {
          j++;
        }

        if (columns[i]['id'] != srcColumns[j]['id']) {
          // if the current visible source column isn't the same as the current grid column, that column moved in the
          // grid. move it in the source.
          var index = srcColumns.findIndex(findByField.bind(this, 'id', columns[i]['id']));
          if (index > -1) {
            var targetIndex = j > index ? j - 1 : j;
            insert(changed, srcColumns[index]);
            insert(changed, srcColumns[targetIndex]);
            moveItem(srcColumns, index, targetIndex);
          }
        }
      }

      if (changed.length > 0) {
        this.onUserColumnsChange(changed);
      }

      this.inEvent = false;
    }
  }

  /**
   * Respond to column resize events from slickgrid.
   *
   * @param {*} e The event
   * @param {Object} args The args
   * @private
   */
  onColumnsResized_(e, args) {
    if (!this.inEvent) {
      this.inEvent = true;

      var changed = [];
      var columns = this.getColumnsInternal();
      var columnNodes = this.element.find('.slick-header-column');
      for (var i = 0, n = columnNodes.length; i < n; i++) {
        var nodeWidth = $(columnNodes[i]).outerWidth();
        var columnData = $(columnNodes[i]).data();
        if (nodeWidth > 0 && columnData && columnData['column']) {
          var index = columns.findIndex(findByField.bind(this, 'id', columnData['column']['id']));
          if (index > -1) {
            columns[index]['width'] = nodeWidth;
            changed.push(columns[index]);
          }
        }
      }

      if (changed.length > 0) {
        this.onUserColumnsChange(changed);
      }

      this.inEvent = false;
    }
  }

  /**
   * Handle the column reset event.
   *
   * @param {MenuEvent<ColumnContext>} event The column menu event.
   * @protected
   */
  onColumnReset(event) {
    var context = event.getContext();
    if (context && context.grid === this) {
      var columns = this.getColumnsInternal();
      columns.forEach(function(column) {
        column['visible'] = true;
        column['width'] = Math.max(80, ui.measureText(column['name']).width + 20);
        column['userModified'] = false;
      });

      this.onUserColumnsChange();
    }
  }

  /**
   * Handle a column being removed from the grid.
   *
   * @param {MenuEvent<ColumnContext>} event The column menu event.
   * @protected
   */
  onColumnRemove(event) {
    var context = event.getContext();
    if (context && context.grid === this && context.column) {
      var columns = this.getColumnsInternal();
      var index = columns.findIndex(findByField.bind(this, 'id', context.column['id']));
      if (index > -1) {
        columns[index]['visible'] = false;
        this.onUserColumnsChange([columns[index]]);
      }
    }
  }

  /**
   * Handler to move a column to the front of the array.
   *
   * @param {MenuEvent<ColumnContext>} event The column menu event.
   * @protected
   */
  onColumnFirst(event) {
    var context = event.getContext();
    if (context && context.grid === this && context.column) {
      var columns = this.getColumnsInternal();
      var index = columns.findIndex(findByField.bind(this, 'id', context.column['id']));
      if (index > -1) {
        moveItem(columns, index, 0);
        this.onUserColumnsChange([columns[index]]);
      }
    }
  }

  /**
   * Handler to move a column to the back of the array.
   *
   * @param {MenuEvent<ColumnContext>} event The column menu event.
   * @protected
   */
  onColumnLast(event) {
    var context = event.getContext();
    if (context && context.grid === this && context.column) {
      var columns = this.getColumnsInternal();
      var index = columns.findIndex(findByField.bind(this, 'id', context.column['id']));
      if (index > -1) {
        moveItem(columns, index, columns.length - 1);
        this.onUserColumnsChange([columns[index]]);
      }
    }
  }

  /**
   * Handler to launch the column manager window
   *
   * @param {MenuEvent<ColumnContext>|angular.Scope.Event} event The column menu event.
   * @protected
   */
  onColumnManager(event) {
    var columns = this.getColumnsInternal();

    if (columns) {
      launchColumnManager(columns, this.onUserColumnsChange.bind(this));
    }
  }

  /**
   * Get the context menu action args for a context event.
   *
   * @param {GoogEvent=} opt_event
   * @return {*}
   * @protected
   */
  getContextArgs(opt_event) {
    return this.scope['selected'];
  }

  /**
   * Set the context menu used by the grid.
   *
   * @param {ActionManager|Menu|undefined} menu The context menu.
   * @protected
   */
  setContextMenu(menu) {
    this.contextMenu_ = menu;
  }

  /**
   * Get the menu to use for selected items in the grid.
   *
   * @return {ActionManager|Menu|undefined} The menu.
   * @protected
   */
  getContextMenuFromSelected() {
    var selected = this.scope['selected'];
    var menu = null;

    if (selected) {
      for (var i = 0, n = selected.length; i < n; i++) {
        var item = selected[i];

        if (osImplements(item, IMenuSupplier.ID)) {
          var itemMenu = /** @type {IMenuSupplier} */ (item).getMenu();

          if (!menu) {
            menu = itemMenu;
          } else if (menu.constructor !== itemMenu.constructor) {
            menu = null;
            break;
          }
        } else {
          menu = null;
          break;
        }
      }
    }

    return menu || this.contextMenu_;
  }

  /**
   * Handle a context menu event.
   *
   * @param {(angular.Scope.Event|BrowserEvent)} event
   * @param {Array<number>=} opt_position The menu position
   * @private
   * @suppress {deprecated}
   */
  onContextMenu_(event, opt_position) {
    event.preventDefault();

    var contextArgs = null;
    var menuX = 0;
    var menuY = 0;

    if (event instanceof BrowserEvent) {
      // event was triggered by right clicking the grid
      event.stopPropagation();

      contextArgs = this.getContextArgs(event);
      menuX = event.clientX;
      menuY = event.clientY;
    } else if (opt_position && opt_position.length == 2) {
      // event was fired on the scope
      contextArgs = this.getContextArgs();
      menuX = opt_position[0];
      menuY = opt_position[1];
    }

    var menu = this.getContextMenuFromSelected();

    if (contextArgs != null) {
      if (menu instanceof ActionManager) {
        menu.withActionTarget(this);
        menu.withActionArgs(contextArgs);
        menu.refreshEnabledActions();

        if (menu.hasEnabledActions()) {
          openMenu(menu, {x: menuX, y: menuY});
        }
      } else if (menu instanceof Menu) {
        const rect = this.element[0].getBoundingClientRect();

        menuX -= rect.left;
        menuY -= rect.top;

        menu.open(contextArgs, {
          my: 'left top',
          at: 'left+' + menuX + ' top+' + menuY,
          of: this.element[0]
        }, this);
      }
    }
  }

  /**
   * Handle a header context menu open event.
   *
   * @param {(angular.Scope.Event|BrowserEvent)} event The menu open event.
   * @param {jQuery.PositionOptions=} opt_position The menu position options.
   * @private
   */
  onHeaderContextMenu_(event, opt_position) {
    event.preventDefault();

    var headerColumn;
    var position;

    if (event instanceof BrowserEvent) {
      // event was triggered by right clicking a column
      event.stopPropagation();

      var contextTarget = /** @type {Element} */ (event.target);
      headerColumn = contains(contextTarget, 'slick-header-column') ?
        event.target : getAncestorByClass(contextTarget, 'slick-header-column');

      position = {
        my: 'left top',
        at: 'left+' + event.clientX + ' top+' + event.clientY,
        of: windowSelector.CONTAINER
      };
    } else if (goog.isObject(opt_position)) {
      // event was fired on the scope
      position = opt_position;
    }

    if (this.columnMenu && position) {
      var column = headerColumn ? /** @type {ColumnDefinition} */ ($(headerColumn).data('column')) : undefined;
      if (!column || !column['internal']) {
        this.columnMenu.open(/** @type {!ColumnContext} */ ({
          columns: this.getColumnsInternal(),
          column: column,
          grid: this
        }), position);
      }
    }
  }

  /**
   * Handles options changes
   *
   * @param {Array} newOptions
   * @param {Array} oldOptions
   * @protected
   */
  onOptionsChange(newOptions, oldOptions) {
    this.grid.setOptions(this.getOptions());
  }

  /**
   * Handles external selection changes
   *
   * @param {*} newVal
   * @param {*=} opt_oldVal
   * @protected
   */
  onSelectedChange(newVal, opt_oldVal) {
    if (!this.inEvent) {
      this.inEvent = true;

      // Only set selection if it was clicked
      if (newVal) {
        newVal = Array.isArray(newVal) ? newVal : [newVal];
        this.setSelectedRows(newVal.map(this.mapItemsToRows, this));
      } else {
        this.setSelectedRows([]);
      }

      // if selection changed by means other than user interaction, reset the active cell so Slickgrid doesn't prevent
      // it from being selected again. this fixes a bug where clicking a cell, then Deselect All, then clicking the cell
      // again doesn't select the row
      if (!this.inInteraction) {
        this.grid.resetActiveCell();
      }

      this.inEvent = false;
    }
  }

  /**
   * Maps row numbers to items
   *
   * @param {number} row The row number
   * @param {number} i The index
   * @param {Array} arr
   * @return {*}
   * @protected
   */
  mapRowsToItems(row, i, arr) {
    return this.grid.getDataItem(row);
  }

  /**
   * Maps items to row numbers
   *
   * @param {*} item
   * @param {number=} opt_idx The index
   * @param {Array=} opt_arr
   * @return {(number|undefined)}
   * @protected
   */
  mapItemsToRows(item, opt_idx, opt_arr) {
    return this.dataView.getRowById(item[this.scope['idField'] || 'id']);
  }

  /**
   * Handles grid selection changes
   *
   * @param {*} e The event
   * @param {Object} args The args
   * @protected
   */
  onGridSelectedChange(e, args) {
    if (!this.inEvent) {
      this.inEvent = true;

      var rows = /** @type {?Array<number>} */ (args['rows']);

      if (rows) {
        var result = rows.map(this.mapRowsToItems, this);
        var options = this.grid.getOptions();
        var selected = options['multiSelect'] ? result : result[0] || null;

        this.scope['selected'] = selected;
        this.scope.$emit(SlickGridEvent.SELECTION_CHANGE, selected);
        this.apply();
      }

      this.inEvent = false;
    }
  }

  /**
   * Run apply on the scope
   *
   * @protected
   */
  apply() {
    ui.apply(this.scope);
  }

  /**
   * A given cell's editor has been created
   *
   * @param {*=} event The Event
   * @param {Object=} data Properties of what cell is being affected
   * @protected
   */
  beforeCellEdited(event, data) {
    this.scope.$emit(SlickGridEvent.BEFORE_CELL_EDITED, event, data);
  }

  /**
   * A given cell's value has been changed
   *
   * @param {*=} event The Event
   * @param {Object=} data Properties of what cell is being affected
   * @protected
   */
  cellChanged(event, data) {
    this.scope.$emit(SlickGridEvent.CELL_CHANGED, event, data);
  }

  /**
   * The cell is no longer being edited.
   * This is triggered when an edit has been made or discarded.
   *
   * @param {*=} event The Event
   * @param {Object=} scope Editor and Grid instances
   * @protected
   */
  cellEditorDestroyed(event, scope) {
    this.scope.$emit(SlickGridEvent.CELL_EDITOR_DESTROYED, event, scope);
  }

  /**
   * Triggers another render and refresh of the display
   *
   * @param {angular.Scope.Event} event
   * @protected
   */
  refreshDataView(event) {
    this.dataView.refresh();
  }

  /**
   * Puts column objects on the sortColumn objects
   *
   * slickgrid doesn't have a quick getColumnById method, so we'll go ahead and
   * put the actual column on the sort column so that it is quickly accessible in
   * the sort methods.
   *
   * This changes slickgrid's internal sortColumns array
   * @return {!Array<Slick.Grid.SortColumn>} The modified sort columns
   * @private
   */
  putRealColumnsOnSortColumns_() {
    const cols = this.grid.getSortColumns();
    const realCols = this.grid.getColumns();

    for (const col of cols) {
      const index = this.grid.getColumnIndex(col['columnId']);
      if (typeof index === 'number' && realCols[index]) {
        col['column'] = realCols[index];
      }
    }

    return cols;
  }

  /**
   * Handles changes to the sort
   *
   * @param {*=} opt_e The Event
   * @param {Object=} opt_args The args
   * @protected
   */
  onSortChange(opt_e, opt_args) {
    this.dataView.beginUpdate();

    const cols = this.putRealColumnsOnSortColumns_();

    var compare = this.scope['compare'] || this.multiColumnSort.bind(this, cols);
    this.dataView.sort(compare);
    this.dataView.endUpdate();

    // slickgrid doesn't update the active cell correctly on sort, so clear it
    this.grid.resetActiveCell();

    this.scope.$emit(SlickGridEvent.SORT_CHANGED, cols);
  }

  /**
   * Compare function over multiple columns
   *
   * @param {!Array<Slick.Grid.SortColumn>} cols The sort columns
   * @param {*} a
   * @param {*} b
   * @return {number} -1, 0, or 1 per typical compare function
   * @protected
   */
  multiColumnSort(cols, a, b) {
    for (var i = 0, n = cols.length; i < n; i++) {
      var field = cols[i]['column']['sortField'] || cols[i]['column']['field'];
      var sign = cols[i]['sortAsc'] ? 1 : -1;
      var v1;
      var v2;
      var extractor = null;
      if (this.useExtractorInSort && this.scope['options']) {
        if (this.scope['options']['dataItemColumnSortValueExtractor']) {
          extractor = this.scope['options']['dataItemColumnSortValueExtractor'];
        } else if (this.scope['options']['dataItemColumnValueExtractor']) {
          extractor = this.scope['options']['dataItemColumnValueExtractor'];
        }
      }

      if (extractor) {
        v1 = extractor(a, field);
        v2 = extractor(b, field);
      } else {
        v1 = a[field];
        v2 = b[field];
      }

      var t1 = typeof v1;
      if (t1 === 'string') {
        v1 = v1.trim().toLowerCase();

        // sort empty strings the same as undefined/null
        if (!v1) {
          v1 = null;
        }
      }

      var t2 = typeof v2;
      if (t2 === 'string') {
        v2 = v2.trim().toLowerCase();

        // sort empty strings the same as undefined/null
        if (!v2) {
          v2 = null;
        }
      }

      // if at least one value is null/undefined, we can stop here. non-null values > null values.
      if (v1 == null || v2 == null) {
        return v1 == v2 ? 0 : ((v1 == null ? 1 : -1) * sign);
      }

      var result = undefined;
      if (t1 != t2) {
        // if one type is a number, coerce to a number
        if (t1 == 'number') {
          v2 = parseFloat(v2);

          if (isNaN(v2)) {
            v2 = Number.MAX_VALUE * sign;
          }
        } else if (t2 == 'number') {
          v1 = parseFloat(v1);

          if (isNaN(v1)) {
            v2 = Number.MAX_VALUE * sign;
          }
        }
      } else if (typeof /** @type {IComparable} */ (v1).compare == 'function') {
        result = /** @type {IComparable} */ (v1).compare(v2) * sign;
      } else if (t1 != 'number' && FLOAT.test(v1) && FLOAT.test(v2)) {
        // parse strings to numbers if we can so they sort correctly
        v1 = parseFloat(v1);
        v2 = parseFloat(v2);
      }

      if (result == undefined) {
        // inlined defaultCompare to avoid the function call
        result = (v1 > v2 ? 1 : v1 < v2 ? -1 : 0) * sign;
      }

      if (result !== 0) {
        // as soon as we find an unequal column, return
        return result;
      }
    }

    return 0;
  }

  /**
   * Handles changes to the sort
   *
   * @param {*=} opt_e The Event
   * @param {Object=} opt_args The args
   * @suppress {checkTypes}
   */
  onSortBySelectionChange(opt_e, opt_args) {
    this.dataView.beginUpdate();

    const cols = this.putRealColumnsOnSortColumns_();

    // get the selected data from the grid and not the source!
    var data = /** @type {Slick.Data.DataView} */ (this.grid.getData());
    var selectedRows = this.getSelectedRows();
    var selectedFeatureIndexes = data.mapRowsToIds(selectedRows);
    var selectionMap = createSet(selectedFeatureIndexes);

    var compare = this.selectColumnSort.bind(this, selectionMap, cols);
    this.dataView.sort(compare);
    this.dataView.endUpdate();
  }

  /**
   * Compare function over multiple columns bringing selected items to the top
   *
   * @param {!Object<string,boolean>} sel The selected features
   * @param {!Array<Slick.Grid.SortColumn>} cols The sort columns
   * @param {Object} a
   * @param {Object} b
   * @return {number} -1, 0, or 1 per typical compare function
   * @protected
   */
  selectColumnSort(sel, cols, a, b) {
    var aInSelected = sel[a['id']];
    var bInSelected = sel[b['id']];

    if (aInSelected === bInSelected) { // both are selected or not, compare them
      return this.multiColumnSort.call(this, cols, a, b);
    } else {
      return bInSelected ? 1 : -1;
    }
  }

  /**
   * Compiles any angular directives in the cell HTML
   *
   * @param {*} e The event
   * @param {{row: number, node: Element, item: Object}} args The event data
   * @protected
   */
  onRowRender(e, args) {
    // make a new scope
    var s = this.scope.$new();

    if (goog.isObject(this.scope['rowScope'])) {
      Object.assign(s, this.scope['rowScope']);
    }

    // put the data item on the scope
    s['item'] = args['item'];

    // compile
    this.compile(args['node'])(s);
  }

  /**
   * Destroys the scope and any angular directives for removed rows
   *
   * @param {*} e The event
   * @param {{node: Element}} args The event data
   * @protected
   */
  onRowRemove(e, args) {
    /**
     * SlickGrid does not do the JQuery/Angular destruction of the node
     * and instead calls the DOM removeChild() function directly. While
     * this is extremely fast, it is bad for the tree since we intend to
     * use Angular directives in each cell. Therefore, we will destroy
     * it ourselves.
     */
    var el = angular.element(args['node']);
    var s = el.scope();
    el.remove();

    if (s) {
      s.$destroy();
    }
  }

  /**
   * Set selected rows on the grid if selection model applied, otherwise do nothing.
   *
   * @param {*} rows
   */
  setSelectedRows(rows) {
    if (this.selectionModel_ != null) {
      this.grid.setSelectedRows(rows);
    }
  }

  /**
   * Get selected rows on the grid if selection model applied, otherwise get empty array.
   *
   * @return {*} rows
   * @protected
   */
  getSelectedRows() {
    return this.selectionModel_ != null ? this.grid.getSelectedRows() : [];
  }

  /**
   * Invalidates the selected rows to force them to render.
   *
   * @protected
   */
  invalidateRows() {
    if (!this.isDisposed()) {
      this.grid.invalidateAllRows();
      this.grid.render();
      this.dataView.refresh();
    }
  }

  /**
   * Invalidates the columns to force them to render.
   *
   * @protected
   */
  invalidateColumns() {
    this.onColumnsChange();
  }

  /**
   * @param {*} e The event
   * @param {Object} args The args
   * @protected
   */
  onDblClick(e, args) {
    if (!this.inEvent) {
      this.inEvent = true;
      var value = angular.element(this.grid.getCellNode(args['row'], args['cell'])).text();
      if (value) {
        value = value.trim();
      }
      copy(value);
      this.inEvent = false;
    }
  }

  /**
   * @param {EventLike} e The event
   * @param {Object<string, *>} dragInfo The drag object
   * @protected
   */
  onDragInit(e, dragInfo) {
    // prevent the grid from cancelling drag/drop by default
    // TODO: we should look at why we need to do this to get slickgrid to handle dragInit correctly
    e.stopImmediatePropagation();
    this.scope.$emit('slickgrid.onDragInit');
  }

  /**
   * @param {EventLike} e The event
   * @param {Object<string, *>} dragInfo The drag object
   * @return {boolean}
   * @protected
   */
  onDragStart(e, dragInfo) {
    if (!this.scope['dragEnabled']) {
      return false;
    }

    var cell = this.grid.getCellFromEvent(e);
    if (!cell) {
      return false;
    }

    var rows = this.grid.getSelectedRows();

    if (rows.length === 0 || rows.indexOf(cell.row) === -1) {
      rows = [cell.row];
    }

    dragInfo['rows'] = rows;

    if (!this.canDragRows(/** @type {Array<number>} */ (rows))) {
      return false;
    }

    this.dragging = true;

    for (var i = 0, n = rows.length; i < n; i++) {
      $(this.grid.getCellNode(rows[i], 0)).parent().addClass('slick-dragging');
    }

    e.stopImmediatePropagation();
    dragInfo['insertBefore'] = -1;

    var rowHeight = this.grid.getOptions()['rowHeight'];
    var canvas = /** @type {Element} */ (this.grid.getCanvasNode());

    dragInfo['rect'] = $('<div class=\'slick-reorder-proxy\'/>').
        css('position', 'absolute').
        css('zIndex', '99999').
        css('width', /** @type {number} */ ($(canvas).innerWidth())).
        css('height', rowHeight * rows.length).
        appendTo(canvas);

    dragInfo['guide'] = $('<div class=\'slick-reorder-guide\'/>').
        css('position', 'absolute').
        css('zIndex', '99998').
        css('width', /** @type {number} */ ($(canvas).innerWidth())).
        css('top', -1000).
        appendTo(canvas);

    return true;
  }

  /**
   * @param {Array<number>} rows
   * @return {boolean} Whether or not the rows can be dragged
   */
  canDragRows(rows) {
    return true;
  }

  /**
   * @param {EventLike} e The event
   * @return {number} position on grid
   */
  calcPos(e) {
    var pos = e.pageY - $(this.grid.getCanvasNode()).offset()['top'];
    var viewport = this.element.find('.slick-viewport');
    var internalPos = e.pageY - viewport.offset()['top'];
    var tolerance = 15;
    var top = internalPos < tolerance;
    var bot = this.element.height() - internalPos < tolerance;

    if (top) {
      this.magnitude_ = 2 * Math.log(tolerance + 1 - internalPos);
    } else if (bot) {
      this.magnitude_ = -2 * Math.log(tolerance + 1 + internalPos - this.element.height());
    }

    if (top || bot) {
      this.scrollTimer.start();
    } else {
      this.scrollTimer.stop();
    }


    return pos;
  }

  /**
   * @param {EventLike} e The event
   * @param {Object<string, *>} dragInfo The drag object
   * @return {boolean}
   * @protected
   */
  onDrag(e, dragInfo) {
    if (!this.dragging) {
      return false;
    }

    e.stopImmediatePropagation();
    var pos = this.calcPos(e);
    var rowHeight = this.grid.getOptions()['rowHeight'];
    dragInfo['rect'].css('top', pos - 5);

    // get move index
    var insertBefore = Math.max(0, Math.min(
        Math.round(pos / rowHeight), this.grid.getDataLength()));

    if (insertBefore !== dragInfo['insertBefore']) {
      if (this.canDragMove(/** @type {Array<number>} */ (dragInfo['rows']), insertBefore)) {
        dragInfo['guide'].css('top', insertBefore * rowHeight);
        dragInfo['rect'].css('background', 'blue');
        dragInfo['canMove'] = true;
      } else {
        dragInfo['guide'].css('top', -1000);
        dragInfo['rect'].css('background', 'red');
        dragInfo['canMove'] = false;
      }

      dragInfo['insertBefore'] = insertBefore;
    }

    return true;
  }

  /**
   * @param {Array<number>} rows
   * @param {number} insertBefore
   * @return {boolean}
   * @protected
   */
  canDragMove(rows, insertBefore) {
    if (isNaN(insertBefore)) {
      return false;
    }

    for (var i = 0, n = rows.length; i < n; i++) {
      // no point in moving before or after itself
      if (rows[i] == insertBefore || rows[i] == insertBefore - 1) {
        return false;
      }
    }

    return true;
  }

  /**
   * @param {EventLike} e The event
   * @param {Object<string, *>} dragInfo The drag object
   * @return {boolean}
   * @protected
   */
  onDragEnd(e, dragInfo) {
    this.scrollTimer.stop();
    if (!this.dragging) {
      return false;
    }

    this.dragging = false;
    e.stopImmediatePropagation();

    dragInfo['guide'].remove();
    dragInfo['rect'].remove();

    var rows = /** @type {Array<number>} */ (dragInfo['rows']);
    for (var i = 0, n = rows.length; i < n; i++) {
      $(this.grid.getCellNode(rows[i], 0)).parent().removeClass('slick-dragging');
    }

    if (dragInfo['canMove']) {
      this.doMove(/** @type {Array<number>} */ (dragInfo['rows']), /** @type {number} */ (dragInfo['insertBefore']));
      this.scope.$emit(SlickGridEvent.ORDER_CHANGE);
    }

    return true;
  }

  /**
   * @param {Array<number>} rows
   * @param {number} insertBefore
   * @protected
   */
  doMove(rows, insertBefore) {
    var extractedRows = [];
    var data = this.getData();
    var left = data.slice(0, insertBefore);
    var right = data.slice(insertBefore, data.length);

    rows.sort(Controller.rowSort);

    for (var i = 0, n = rows.length; i < n; i++) {
      extractedRows.push(data[rows[i]]);
    }

    rows.reverse();

    for (i = 0, n = rows.length; i < n; i++) {
      var row = rows[i];

      if (row < insertBefore) {
        left.splice(row, 1);
      } else {
        right.splice(row - insertBefore, 1);
      }
    }

    data = left.concat(extractedRows.concat(right));

    this.scope['data'] = data;
    this.onDataChange();
  }

  /**
   * @param {*} e The event
   * @param {Object} args The args
   * @protected
   */
  onMouseEnter(e, args) {
    if (!this.inEvent) {
      this.inEvent = true;
      var cell = this.grid.getCellFromEvent(e);

      if (this.scope['cellTooltips']) {
        // Set the tooltip
        var node = $(this.grid.getCellNode(cell['row'], cell['cell']));
        node.attr('title', /** @type {string} */ (node.text()));
      }

      var row = /** @type {?Array<number>} */ (cell['row']);
      var item = this.grid.getDataItem(row);
      this.scope.$emit(SlickGridEvent.HIGHLIGHT_CHANGE, item);
      this.inEvent = false;
    }
  }

  /**
   * @param {*} e The event
   * @param {Object} args The args
   * @protected
   */
  onMouseLeave(e, args) {
    if (!this.inEvent) {
      this.inEvent = true;
      this.scope.$emit(SlickGridEvent.HIGHLIGHT_CHANGE, null);
      this.inEvent = false;
    }
  }

  /**
   * Commits the current edit if one is active.
   *
   * @param {angular.Scope.Event} event The event.
   * @protected
   */
  onCommitEdit(event) {
    if (this.grid && this.grid.getEditorLock().isActive()) {
      this.grid.getEditorLock().commitCurrentEdit();
    }
  }

  /**
   * @param {number} a
   * @param {number} b
   * @return {number}
   * @protected
   */
  static rowSort(a, b) {
    return a - b;
  }
}

/**
 * These are meant as changes to the SlickGrid defaults, and are not exhaustive
 * @type {Object<string, *>}
 */
const defaultOptions = {
  'multiColumnSort': true
};

/**
 * Default message to display when the user tries copying too much data to the clipboard.
 * @type {string}
 */
Controller.COPY_LIMIT_MSG = 'Data exceeds the maximum copy limit. Please reduce the ' +
    'selected/displayed data and try again.';
