goog.provide('os.ui.FiltersCtrl');
goog.provide('os.ui.filtersDirective');

goog.require('os.MapContainer');
goog.require('os.action.query.import');
goog.require('os.command.SequenceCommand');
goog.require('os.data.FilterTreeSearch');
goog.require('os.defines');
goog.require('os.layer');
goog.require('os.metrics.Metrics');
goog.require('os.query');
goog.require('os.query.FilterManager');
goog.require('os.ui.CombinatorCtrl');
goog.require('os.ui.FilterLayerGroupBy');
goog.require('os.ui.Module');
goog.require('os.ui.addFilterDirective');
goog.require('os.ui.filter.ui.FilterGroupBy');
goog.require('os.ui.filter.ui.filterTreeDirective');
goog.require('os.ui.im.ImportEvent');
goog.require('os.ui.menu.filter');
goog.require('os.ui.query.QueryManager');
goog.require('os.ui.query.cmd.FilterAdd');
goog.require('os.ui.query.cmd.FilterRemove');
goog.require('os.ui.query.ui.CombinatorCtrl');
goog.require('os.ui.slick.AbstractGroupByTreeSearchCtrl');
goog.require('os.ui.slick.slickTreeDirective');
goog.require('os.ui.util.autoHeightDirective');


/**
 * The filters window directive
 * @return {angular.Directive}
 */
os.ui.filtersDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/filters.html',
    controller: os.ui.FiltersCtrl,
    controllerAs: 'filtersCtrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('filters', [os.ui.filtersDirective]);



/**
 * Controller for Filters window
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.slick.AbstractGroupByTreeSearchCtrl}
 * @constructor
 * @ngInject
 */
os.ui.FiltersCtrl = function($scope, $element) {
  os.ui.FiltersCtrl.base(this, 'constructor', $scope, $element, 25);

  this.title = 'filters';
  try {
    this.scope['contextMenu'] = os.ui.menu.FILTER;
  } catch (e) {
  }

  this.viewDefault = 'Layer Type';

  /**
   * @type {?os.data.FilterTreeSearch}
   */
  this.treeSearch = new os.data.FilterTreeSearch('filters', this.scope);
  this.scope['views'] = os.ui.FiltersCtrl.VIEWS;
  this.init();

  $scope.$on('filterCopy', this.onCopyFilter_.bind(this));
  $scope.$on('filterEdit', this.onEditFilter_.bind(this));
  $scope.$on('filterComplete', this.onEditComplete_.bind(this));

  os.ui.filterManager.listen(goog.events.EventType.PROPERTYCHANGE, this.searchIfAddedOrRemoved_, false, this);
  os.ui.filterManager.listen(os.ui.filter.FilterEventType.FILTERS_REFRESH, this.search, false, this);
  os.ui.filterManager.listen(os.ui.filter.FilterEventType.EXPORT_FILTER, this.export, false, this);

  var map = os.MapContainer.getInstance();
  map.listen(os.events.LayerEventType.ADD, this.search, false, this);
  map.listen(os.events.LayerEventType.REMOVE, this.search, false, this);
};
goog.inherits(os.ui.FiltersCtrl, os.ui.slick.AbstractGroupByTreeSearchCtrl);


/**
 * The view options for grouping filters
 * @type {!Object<string, os.data.groupby.INodeGroupBy>}
 */
os.ui.FiltersCtrl.VIEWS = {
  'None': -1, // you can't use null because Angular treats that as the empty/unselected option
  'Layer': new os.ui.FilterLayerGroupBy(),
  'Layer Type': new os.ui.FilterLayerGroupBy(true)
};


/**
 * @inheritDoc
 */
os.ui.FiltersCtrl.prototype.destroy = function() {
  os.ui.filterManager.unlisten(os.ui.filter.FilterEventType.EXPORT_FILTER, this.export, false, this);
  os.ui.filterManager.unlisten(os.ui.filter.FilterEventType.FILTERS_REFRESH, this.search, false, this);
  os.ui.filterManager.unlisten(goog.events.EventType.PROPERTYCHANGE, this.searchIfAddedOrRemoved_, false, this);
  var map = os.MapContainer.getInstance();
  map.unlisten(os.events.LayerEventType.ADD, this.search, false, this);
  map.unlisten(os.events.LayerEventType.REMOVE, this.search, false, this);
  os.ui.FiltersCtrl.base(this, 'destroy');
};


/**
 * Launches the advanced combination window
 */
os.ui.FiltersCtrl.prototype.launch = function() {
  os.ui.CombinatorCtrl.launch();
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Filters.ADVANCED, 1);
};
goog.exportProperty(os.ui.FiltersCtrl.prototype, 'launch', os.ui.FiltersCtrl.prototype.launch);


/**
 * Pop up filter export gui
 * @param {os.ui.filter.FilterEvent=} opt_event right click export event
 */
os.ui.FiltersCtrl.prototype.export = function(opt_event) {
  os.ui.filter.ui.launchFilterExport(this.save_.bind(this));
};
goog.exportProperty(
    os.ui.FiltersCtrl.prototype,
    'export',
    os.ui.FiltersCtrl.prototype.export);


/**
 * Disables export button
 * @return {boolean}
 */
os.ui.FiltersCtrl.prototype.exportDisabled = function() {
  // off when no filters present
  var filters = os.ui.filterManager.getFilters();
  if (filters && filters.length > 0) {
    return false;
  }

  return true;
};
goog.exportProperty(os.ui.FiltersCtrl.prototype, 'exportDisabled', os.ui.FiltersCtrl.prototype.exportDisabled);


/**
 * Save the filters to a file
 * @param {string} name of the file
 * @param {os.ui.filter.ui.FilterExportChoice} mode how to export filters
 * @private
 */
os.ui.FiltersCtrl.prototype.save_ = function(name, mode) {
  var filters = [];
  if (mode != os.ui.filter.ui.FilterExportChoice.SELECTED) {
    this.flatten_(this.scope['filters'], filters,
        mode == os.ui.filter.ui.FilterExportChoice.ACTIVE);
  } else if (this.scope['selected'] && this.scope['selected'].length) {
    filters = this.scope['selected'];
  } else if (this.scope['selected']) {
    filters = [this.scope['selected']];
  }

  // remove nodes that are not filters (e.g. the layer node in Group Type -> Layer Type)
  filters = goog.array.filter(filters, function(f) {
    return f instanceof os.data.FilterNode;
  });

  os.ui.filter.ui.export(name, filters);
};


/**
 * Get filters out of the tree
 * @param {Array} arr The array of items
 * @param {Array} result The resulting flat array
 * @param {boolean} activeOnly get only the active filters
 * @private
 */
os.ui.FiltersCtrl.prototype.flatten_ = function(arr, result, activeOnly) {
  if (arr) {
    for (var i = 0, n = arr.length; i < n; i++) {
      var item = /** @type {os.ui.slick.SlickTreeNode} */ (arr[i]);
      if (item.getChildren()) {
        // parent node
        this.flatten_(item.getChildren(), result, activeOnly);
      } else if ((activeOnly && item.getState() == 'on' || !activeOnly) && item.getEntry()) {
        var filterId = item.getId();
        if (goog.isDef(filterId) && filterId != '*') {
          result.push(item);
        }
      }
    }
  }
};


/**
 * import filters
 */
os.ui.FiltersCtrl.prototype.import = function() {
  os.query.launchQueryImport();
};
goog.exportProperty(
    os.ui.FiltersCtrl.prototype,
    'import',
    os.ui.FiltersCtrl.prototype.import);


/**
 * Handles adds/edits to filters
 * @param {angular.Scope.Event} event
 * @param {os.filter.FilterEntry} entry
 * @private
 */
os.ui.FiltersCtrl.prototype.onEditFilter_ = function(event, entry) {
  var filterable = /** @type {os.filter.IFilterable} */ (os.ui.filterManager.getFilterable(entry.getType()));
  var cols = null;
  try {
    if (filterable) {
      cols = filterable.getFilterColumns();
    }
  } catch (e) {
    // most likely, layer wasn't an IFilterable implementation
  }
  if (cols) {
    os.ui.filter.FilterManager.edit(entry.getType(), cols, this.editEntry.bind(this), entry);
  }
};


/**
 * Handles adds/edits to filters
 * @param {angular.Scope.Event} event
 * @param {os.filter.FilterEntry} entry
 * @private
 */
os.ui.FiltersCtrl.prototype.onEditComplete_ = function(event, entry) {
  event.stopPropagation();

  this.editEntry(entry);
};


/**
 * Handles adds/edits to filters
 * @param {os.filter.FilterEntry} entry
 * @protected
 */
os.ui.FiltersCtrl.prototype.editEntry = function(entry) {
  if (entry) {
    var fqm = os.ui.filterManager;
    var original = fqm.getFilter(entry.getId());

    if (original) {
      // edit
      var rm = new os.ui.query.cmd.FilterRemove(original);
      var add = new os.ui.query.cmd.FilterAdd(entry);
      var edit = new os.command.SequenceCommand();
      edit.setCommands([rm, add]);
      edit.title = 'Edit Filter ' + entry.getTitle();
      os.command.CommandProcessor.getInstance().addCommand(edit);
    } else {
      // add
      os.command.CommandProcessor.getInstance().addCommand(new os.ui.query.cmd.FilterAdd(entry));
    }
  }
};


/**
 * Handles adds/edits to filters
 * @param {angular.Scope.Event} event
 * @param {os.filter.FilterEntry} entry
 * @private
 */
os.ui.FiltersCtrl.prototype.onCopyFilter_ = function(event, entry) {
  os.ui.filter.FilterManager.copy(entry, entry.getType());
};


/**
 * Preform a search only if a node is added, updated, or removed
 * @param {os.events.PropertyChangeEvent} event The event
 * @private
 */
os.ui.FiltersCtrl.prototype.searchIfAddedOrRemoved_ = function(event) {
  if (event && event.getProperty() !== 'toggle') {
    this.search();
  }
};


/**
 * Handles Group By change
 */
os.ui.FiltersCtrl.prototype.onGroupChange = function() {
  this.search();
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Filters.GROUP_BY, 1);
};
goog.exportProperty(
    os.ui.FiltersCtrl.prototype,
    'onGroupChange',
    os.ui.FiltersCtrl.prototype.onGroupChange);


/**
 * Handles Group By change
 */
os.ui.FiltersCtrl.prototype.onSearchTermChange = function() {
  this.search();
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Filters.SEARCH, 1);
};
goog.exportProperty(
    os.ui.FiltersCtrl.prototype,
    'onSearchTermChange',
    os.ui.FiltersCtrl.prototype.onSearchTermChange);
