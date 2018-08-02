goog.provide('os.ui.grid.DataGridCtrl');



/**
*
* @param {!angular.Scope} $scope
* @param {!angular.JQLite} $element
* @param {!angular.$timeout} $timeout
* @constructor
* @ngInject
*/
os.ui.grid.DataGridCtrl = function($scope, $element, $timeout) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {?Slick.Grid}
   * @private
   */
  this.grid_ = null;

  /**
   * @type {?Slick.Data.DataView}
   * @private
   */
  this.dataView_ = null;

  /**
   * @type {?Slick.Grid.ValueExtractor}
   * @private
   */
  this.valueExtractor_ = null;

  /**
   * @type {?Object}
   * @private
   */
  this.sortColumn_ = null;

  $scope.$watch('data', function(newVal, oldVal) {
    if (newVal !== oldVal) {
      this.updateData_(newVal);
      this.resetGrid_();
    }
  }.bind(this));

  $scope.$watch('data.length', function(newVal, oldVal) {
    this.updateData_(this.scope_['data']);
    this.resetGrid_();
  }.bind(this));

  $scope.$watch('columns', function(newVal, oldVal) {
    if (newVal.length !== oldVal.length) {
      this.grid_.setColumns(newVal);
    }
  }.bind(this));

  $scope.$watch('filter', function(newVal) {
    if (this.dataView_) {
      this.dataView_.setFilter(newVal || null);
      this.resetGrid_();
    }
  }.bind(this));

  $scope.$on('datagrid.resetGrid', this.resetGrid_.bind(this));
  $scope.$on('datagrid.resizeGrid', this.resizeGrid_.bind(this));
  $scope.$on('$destroy', this.destroy_.bind(this));

  $timeout(function() {
    this.createGrid($element);
  }.bind(this));
};


/**
 * @private
 */
os.ui.grid.DataGridCtrl.prototype.destroy_ = function() {
  this.scope = null;

  this.grid_.invalidateAllRows();
  this.grid_.destroy();
  this.grid_ = null;
  this.dataView = null;
};


/**
 * Create the SlickGrid instance.
 * @param {angular.JQLite} el
 */
os.ui.grid.DataGridCtrl.prototype.createGrid = function(el) {
  var options = {
    'enableCellNavigation': true,
    'enableColumnReorder': false,
    'forceFitColumns': true,
    'multiColumnSort': false,
    'multiSelect': false
  };

  if (this.scope_['options']) {
    goog.object.extend(options, this.scope_['options']);
  }

  if (options['dataItemColumnValueExtractor']) {
    this.valueExtractor_ = /** @type {Slick.Grid.ValueExtractor} */ (options['dataItemColumnValueExtractor']);
  }

  this.dataView_ = new Slick.Data.DataView();
  this.grid_ = new Slick.Grid(el, this.dataView_, this.scope_['columns'], options);
  this.grid_.setSelectionModel(new Slick.RowSelectionModel());

  if (this.scope_['defaultSortColumn']) {
    var sortCol = goog.array.find(this.scope_['columns'], function(ele) {
      return ele['id'] == this.scope_['defaultSortColumn'];
    }, this);

    if (sortCol) {
      this.sortColumn_ = sortCol;
      this.grid_.setSortColumn(this.scope_['defaultSortColumn']);
    }
  }

  this.dataView_.onRowCountChanged.subscribe(function(e, args) {
    this.resetGrid_();
  }.bind(this));

  this.dataView_.onRowsChanged.subscribe(function(e, args) {
    this.resetGrid_();
  }.bind(this));

  this.grid_.onSort.subscribe(function(e, args) {
    this.sortColumn_ = args['sortCol'];
    this.dataView_.sort(this.basicSort_.bind(this), args['sortAsc']);
  }.bind(this));

  this.grid_.onSelectedRowsChanged.subscribe(function(e, args) {
    var items = [];
    var rows = /** @type {Array.<number>} */ (this.grid_.getSelectedRows());
    goog.array.forEach(rows, function(row) {
      var item = this.dataView_.getItem(row);
      if (item) {
        items.push(item);
      }
    }, this);

    this.scope_.$emit('datagrid.selectionChanged', items);
  }.bind(this));

  // sync selection on sort/filter. deselect items that are filtered out.
  this.dataView_.syncGridSelection(this.grid_, false);

  if (this.scope_['filter']) {
    this.dataView_.setFilter(this.scope_['filter']);
  }

  if (this.scope_['data']) {
    this.updateData_(this.scope_['data']);
  }
};


/**
 * Sets the items displayed by the data view.
 * @param {Array.<Object>} data
 * @private
 */
os.ui.grid.DataGridCtrl.prototype.updateData_ = function(data) {
  if (this.dataView_) {
    this.dataView_.beginUpdate();
    this.dataView_.setItems(data);
    this.dataView_.endUpdate();

    if (data && this.scope_['defaultSortColumn']) {
      this.dataView_.sort(this.basicSort_.bind(this), true);
    }
  }
};


/**
 * Resets and refreshes the grid and data view.
 * @private
 */
os.ui.grid.DataGridCtrl.prototype.resetGrid_ = function() {
  if (this.grid_ && this.dataView_) {
    this.grid_.resetActiveCell();
    this.grid_.invalidate();
    this.dataView_.refresh();
  }
};


/**
 * Updates the grid size to fit its container.
 * @private
 */
os.ui.grid.DataGridCtrl.prototype.resizeGrid_ = function() {
  if (this.grid_) {
    this.grid_.resizeCanvas();
  }
};


/**
 * @param {Object} a
 * @param {Object} b
 * @return {number}
 * @private
 */
os.ui.grid.DataGridCtrl.prototype.basicSort_ = function(a, b) {
  var aVal = null;
  var bVal = null;
  if (this.valueExtractor_) {
    aVal = this.valueExtractor_(a, this.sortColumn_);
    bVal = this.valueExtractor_(b, this.sortColumn_);
  } else {
    aVal = a[this.sortColumn_.field];
    bVal = b[this.sortColumn_.field];
  }

  return goog.string.caseInsensitiveCompare(aVal, bVal);
};
