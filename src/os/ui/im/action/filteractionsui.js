goog.provide('os.ui.im.action.FilterActionsCtrl');

goog.require('goog.array');
goog.require('os.im.action.ImportActionEventType');
goog.require('os.im.action.filter');
goog.require('os.ui.data.groupby.TagGroupBy');
goog.require('os.ui.im.ImportEvent');
goog.require('os.ui.im.ImportEventType');
goog.require('os.ui.im.action.FilterActionNode');
goog.require('os.ui.im.action.FilterActionTreeSearch');
goog.require('os.ui.im.action.editFilterActionDirective');
goog.require('os.ui.im.action.filterActionExportDirective');
goog.require('os.ui.slick.AbstractGroupByTreeSearchCtrl');
goog.require('os.ui.window');



/**
 * Base controller for viewing/editing filter action entries.
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.slick.AbstractGroupByTreeSearchCtrl}
 * @constructor
 * @abstract
 * @template T
 * @ngInject
 */
os.ui.im.action.FilterActionsCtrl = function($scope, $element) {
  os.ui.im.action.FilterActionsCtrl.base(this, 'constructor', $scope, $element, 200);
  this.viewDefault = 'None';
  this.title = 'filterActions';

  /**
   * The Angular scope.
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  /**
   * The root element for the directive.
   * @type {?angular.JQLite}
   * @protected
   */
  this.element = $element;

  /**
   * The filter action entry type.
   * @type {string|undefined}
   */
  this.entryType = /** @type {string|undefined} */ (this.scope['type']);

  /**
   * The selected node(s) in the tree.
   * @type {Array<os.ui.im.action.FilterActionNode>|os.ui.im.action.FilterActionNode}
   */
  this['selected'] = null;

  /**
   * Action entries to view/edit.
   * @type {!Array<!os.ui.im.action.FilterActionNode>}
   */
  this.scope['entries'] = [];

  /**
   * @type {?os.ui.im.action.FilterActionTreeSearch}
   */
  this.treeSearch = new os.ui.im.action.FilterActionTreeSearch('entries', this.scope, this.entryType);
  this.scope['views'] = os.ui.im.action.FilterActionsCtrl.VIEWS;
  this.init();

  var iam = os.im.action.ImportActionManager.getInstance();
  iam.listen(os.im.action.ImportActionEventType.REFRESH, this.search, false, this);

  $scope.$on(os.im.action.ImportActionEventType.COPY_ENTRY, this.onCopyEvent.bind(this));
  $scope.$on(os.im.action.ImportActionEventType.EDIT_ENTRY, this.onEditEvent.bind(this));
  $scope.$on(os.im.action.ImportActionEventType.REMOVE_ENTRY, this.onRemoveEvent.bind(this));

  $scope.$on(os.ui.slick.SlickGridEvent.ORDER_CHANGE, this.onOrderChange.bind(this));

  $scope.$on('$destroy', this.dispose.bind(this));

  this.search();
};
goog.inherits(os.ui.im.action.FilterActionsCtrl, os.ui.slick.AbstractGroupByTreeSearchCtrl);


/**
 * The view options for grouping filters
 * @type {!Object<string, os.data.groupby.INodeGroupBy>}
 */
os.ui.im.action.FilterActionsCtrl.VIEWS = {
  'None': -1, // you can't use null because Angular treats that as the empty/unselected option
  'Tags': new os.ui.data.groupby.TagGroupBy()
};


/**
 * @inheritDoc
 */
os.ui.im.action.FilterActionsCtrl.prototype.disposeInternal = function() {
  os.ui.im.action.FilterActionsCtrl.base(this, 'disposeInternal');

  var iam = os.im.action.ImportActionManager.getInstance();
  iam.unlisten(os.im.action.ImportActionEventType.REFRESH, this.search, false, this);

  this.scope = null;
  this.element = null;
};


/**
 * Apply changes.
 * @export
 */
os.ui.im.action.FilterActionsCtrl.prototype.apply = function() {
  this.saveEntries();
};


/**
 * Close the window, discarding any pending changes.
 * @export
 */
os.ui.im.action.FilterActionsCtrl.prototype.close = function() {
  os.ui.window.close(this.element);
};


/**
 * Save the filter action entries to the manager.
 * @protected
 */
os.ui.im.action.FilterActionsCtrl.prototype.saveEntries = function() {
  if (this.scope['entries']) {
    // convert tree nodes back to entries and save
    var entryNodes = [];

    this.scope['entries'].forEach(os.im.action.filter.isFilterActionNode.bind(this, entryNodes));
    var entries = os.ui.im.action.FilterActionNode.toEntries(entryNodes);

    // the tag group by sometimes creates multiple nodes for the same entry, so remove duplicate entries here
    goog.array.removeDuplicates(entries);

    os.im.action.ImportActionManager.getInstance().setActionEntries(this.entryType, entries);
  }
};


/**
 * Get the list of filter columns.
 * @return {!Array} The columns.
 * @protected
 */
os.ui.im.action.FilterActionsCtrl.prototype.getColumns = function() {
  return os.im.action.filter.getColumns(this.entryType);
};


/**
 * Get the initial file name to use for export.
 * @return {string} The file name.
 * @protected
 */
os.ui.im.action.FilterActionsCtrl.prototype.getExportName = function() {
  return os.im.action.filter.getExportName();
};


/**
 * Edit an action entry. If no entry is provided, a new one will be created.
 * @param {os.im.action.FilterActionEntry<T>=} opt_entry The import action entry.
 * @abstract
 * @export
 */
os.ui.im.action.FilterActionsCtrl.prototype.editEntry = function(opt_entry) {};


/**
 * Handle node event to copy an entry.
 * @param {angular.Scope.Event} event The Angular event.
 * @param {os.im.action.FilterActionEntry<T>} entry The import action entry.
 */
os.ui.im.action.FilterActionsCtrl.prototype.onCopyEvent = function(event, entry) {
  event.stopPropagation();

  if (entry) {
    var cmd = os.im.action.filter.copyEntryCmd(entry);
    os.command.CommandProcessor.getInstance().addCommand(cmd);
  }
};


/**
 * Handle node event to edit an entry.
 * @param {angular.Scope.Event} event The Angular event.
 * @param {os.im.action.FilterActionEntry<T>} entry The import action entry.
 */
os.ui.im.action.FilterActionsCtrl.prototype.onEditEvent = function(event, entry) {
  event.stopPropagation();

  if (entry) {
    this.editEntry(entry);
  }
};


/**
 * Handle tree order change event.
 * @param {angular.Scope.Event} event The Angular event.
 * @protected
 */
os.ui.im.action.FilterActionsCtrl.prototype.onOrderChange = function(event) {
  event.stopPropagation();
  this.saveEntries();
};


/**
 * Handle node event to remove an entry.
 * @param {angular.Scope.Event} event The Angular event.
 * @param {os.im.action.FilterActionEntry<T>} entry The import action entry.
 */
os.ui.im.action.FilterActionsCtrl.prototype.onRemoveEvent = function(event, entry) {
  event.stopPropagation();

  if (entry) {
    var cmd = os.im.action.filter.removeEntryCmd(entry);
    os.command.CommandProcessor.getInstance().addCommand(cmd);
  }
};


/**
 * If there is at least one selected entry.
 * @return {boolean} If one or more selected entries are available.
 * @export
 */
os.ui.im.action.FilterActionsCtrl.prototype.hasSelected = function() {
  return this['selected'] && this['selected'].length > 0;
};


/**
 * Launch the export dialog.
 * @export
 */
os.ui.im.action.FilterActionsCtrl.prototype.launchExport = function() {
  os.metrics.Metrics.getInstance().updateMetric(os.im.action.Metrics.EXPORT, 1);

  // pull the entry nodes out of the tree
  var entryNodes = [];
  var selectedEntryNodes = [];

  this.scope['entries'].forEach(os.im.action.filter.isFilterActionNode.bind(this, entryNodes));
  this['selected'].forEach(os.im.action.filter.isFilterActionNode.bind(this, selectedEntryNodes));

  var entries = os.ui.im.action.FilterActionNode.toEntries(entryNodes);
  var selected = os.ui.im.action.FilterActionNode.toEntries(selectedEntryNodes);
  os.ui.im.action.launchFilterActionExport(entries, selected, this.getExportName());
};


/**
 * Launch the import dialog.
 * @export
 */
os.ui.im.action.FilterActionsCtrl.prototype.launchImport = function() {
  os.metrics.Metrics.getInstance().updateMetric(os.im.action.Metrics.IMPORT, 1);

  var event = new os.ui.im.ImportEvent(os.ui.im.ImportEventType.FILE, undefined, undefined, {
    'layerId': this.entryType
  });
  os.dispatcher.dispatchEvent(event);
};
