goog.provide('os.ui.im.action.FilterActionsCtrl');

goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('os.command.SequenceCommand');
goog.require('os.im.action.ImportActionEventType');
goog.require('os.im.action.cmd.FilterActionAdd');
goog.require('os.im.action.cmd.FilterActionRemove');
goog.require('os.ui.im.ImportEvent');
goog.require('os.ui.im.ImportEventType');
goog.require('os.ui.im.action.FilterActionNode');
goog.require('os.ui.im.action.editFilterActionDirective');
goog.require('os.ui.im.action.filterActionExportDirective');
goog.require('os.ui.window');



/**
 * Base controller for viewing/editing filter action entries.
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {goog.Disposable}
 * @constructor
 * @template T
 * @ngInject
 */
os.ui.im.action.FilterActionsCtrl = function($scope, $element) {
  os.ui.im.action.FilterActionsCtrl.base(this, 'constructor');

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
   * Action entries to view/edit.
   * @type {!Array<!os.ui.im.action.FilterActionNode>}
   */
  this['entries'] = [];

  /**
   * The selected node(s) in the tree.
   * @type {Array<os.ui.im.action.FilterActionNode>|os.ui.im.action.FilterActionNode}
   */
  this['selected'] = null;

  var iam = os.im.action.ImportActionManager.getInstance();
  iam.listen(os.im.action.ImportActionEventType.REFRESH, this.refresh, false, this);

  $scope.$on(os.im.action.ImportActionEventType.COPY_ENTRY, this.onCopyEvent.bind(this));
  $scope.$on(os.im.action.ImportActionEventType.EDIT_ENTRY, this.onEditEvent.bind(this));
  $scope.$on(os.im.action.ImportActionEventType.REMOVE_ENTRY, this.onRemoveEvent.bind(this));

  $scope.$on(os.ui.slick.SlickGridEvent.ORDER_CHANGE, this.onOrderChange.bind(this));

  $scope.$on('$destroy', this.dispose.bind(this));

  this.refresh();
};
goog.inherits(os.ui.im.action.FilterActionsCtrl, goog.Disposable);


/**
 * @inheritDoc
 */
os.ui.im.action.FilterActionsCtrl.prototype.disposeInternal = function() {
  os.ui.im.action.FilterActionsCtrl.base(this, 'disposeInternal');

  var iam = os.im.action.ImportActionManager.getInstance();
  iam.unlisten(os.im.action.ImportActionEventType.REFRESH, this.refresh, false, this);

  this.scope = null;
  this.element = null;
};


/**
 * Refresh the displayed entries.
 * @protected
 */
os.ui.im.action.FilterActionsCtrl.prototype.refresh = function() {
  var entries = os.im.action.ImportActionManager.getInstance().getActionEntries(this.entryType);

  // convert to tree nodes
  this['entries'] = os.ui.im.action.FilterActionNode.fromEntries(entries);

  os.ui.apply(this.scope);
};


/**
 * Apply changes.
 */
os.ui.im.action.FilterActionsCtrl.prototype.apply = function() {
  this.saveEntries();
};
goog.exportProperty(
    os.ui.im.action.FilterActionsCtrl.prototype,
    'apply',
    os.ui.im.action.FilterActionsCtrl.prototype.apply);


/**
 * Close the window, discarding any pending changes.
 */
os.ui.im.action.FilterActionsCtrl.prototype.close = function() {
  os.ui.window.close(this.element);
};
goog.exportProperty(
    os.ui.im.action.FilterActionsCtrl.prototype,
    'close',
    os.ui.im.action.FilterActionsCtrl.prototype.close);


/**
 * Save the filter action entries to the manager.
 * @protected
 */
os.ui.im.action.FilterActionsCtrl.prototype.saveEntries = function() {
  if (this['entries']) {
    // convert tree nodes back to entries and save
    var entries = os.ui.im.action.FilterActionNode.toEntries(this['entries']);
    os.im.action.ImportActionManager.getInstance().setActionEntries(this.entryType, entries);
  }
};


/**
 * Get the list of filter columns.
 * @return {!Array} The columns.
 * @protected
 */
os.ui.im.action.FilterActionsCtrl.prototype.getColumns = function() {
  var columns;

  if (this.entryType) {
    var filterable = os.ui.filterManager.getFilterable(this.entryType);
    if (filterable) {
      columns = filterable.getFilterColumns();
    }
  }

  return columns || [];
};


/**
 * Get the initial file name to use for export.
 * @return {string} The file name.
 * @protected
 */
os.ui.im.action.FilterActionsCtrl.prototype.getExportName = function() {
  return os.im.action.ImportActionManager.getInstance().entryTitle + 's';
};


/**
 * Edit an action entry. If no entry is provided, a new one will be created.
 * @param {os.im.action.FilterActionEntry<T>=} opt_entry The import action entry.
 */
os.ui.im.action.FilterActionsCtrl.prototype.editEntry = function(opt_entry) {
  if (this.entryType) {
    var entry = opt_entry ? /** @type {!os.im.action.FilterActionEntry<T>} */ (opt_entry.clone()) : undefined;
    os.ui.im.action.launchEditFilterAction(this.entryType, this.getColumns(),
        this.onEditComplete.bind(this, opt_entry), entry);
  }
};
goog.exportProperty(
    os.ui.im.action.FilterActionsCtrl.prototype,
    'editEntry',
    os.ui.im.action.FilterActionsCtrl.prototype.editEntry);


/**
 * Handle node event to copy an entry.
 * @param {angular.Scope.Event} event The Angular event.
 * @param {os.im.action.FilterActionEntry<T>} entry The import action entry.
 */
os.ui.im.action.FilterActionsCtrl.prototype.onCopyEvent = function(event, entry) {
  event.stopPropagation();

  if (entry) {
    var oldTitle = entry.getTitle();
    var copy = /** @type {!os.im.action.FilterActionEntry<T>} */ (entry.clone());
    copy.setId(goog.string.getRandomString());
    copy.setTitle(oldTitle + ' Copy');

    var iam = os.im.action.ImportActionManager.getInstance();
    var cmd = new os.im.action.cmd.FilterActionAdd(copy);
    cmd.title = 'Copy ' + iam.entryTitle + ' "' + oldTitle + '"';
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
 * Callback for filter action entry create/edit.
 * @param {os.im.action.FilterActionEntry<T>|undefined} original The orignial filter entry, for edits.
 * @param {os.im.action.FilterActionEntry<T>} entry The edited filter entry.
 */
os.ui.im.action.FilterActionsCtrl.prototype.onEditComplete = function(original, entry) {
  if (entry) {
    var cmds = [];

    var entryTitle = entry.getTitle();
    var insertIndex;
    if (original) {
      insertIndex = goog.array.findIndex(this['entries'], function(node) {
        return !!node && node.getEntry() == original;
      });

      entryTitle = original.getTitle();
      cmds.push(new os.im.action.cmd.FilterActionRemove(original, insertIndex));
    }

    cmds.push(new os.im.action.cmd.FilterActionAdd(entry, insertIndex));

    if (cmds.length > 1) {
      var cmd = new os.command.SequenceCommand();
      cmd.setCommands(cmds);

      var appEntryTitle = os.im.action.ImportActionManager.getInstance().entryTitle;
      cmd.title = 'Update ' + appEntryTitle + ' "' + entryTitle + '"';

      os.commandStack.addCommand(cmd);
    } else {
      os.commandStack.addCommand(cmds[0]);
    }
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
    var index = goog.array.findIndex(this['entries'], function(node) {
      return !!node && node.getEntry() == entry;
    });

    if (index < 0) {
      index = undefined;
    }

    var cmd = new os.im.action.cmd.FilterActionRemove(entry, index);
    os.command.CommandProcessor.getInstance().addCommand(cmd);
  }
};


/**
 * If there is at least one selected entry.
 * @return {boolean} If one or more selected entries are available.
 */
os.ui.im.action.FilterActionsCtrl.prototype.hasSelected = function() {
  return this['selected'] && this['selected'].length > 0;
};
goog.exportProperty(
    os.ui.im.action.FilterActionsCtrl.prototype,
    'hasSelected',
    os.ui.im.action.FilterActionsCtrl.prototype.hasSelected);


/**
 * Launch the export dialog.
 */
os.ui.im.action.FilterActionsCtrl.prototype.launchExport = function() {
  os.metrics.Metrics.getInstance().updateMetric(os.im.action.Metrics.EXPORT, 1);

  var entries = os.ui.im.action.FilterActionNode.toEntries(this['entries']);
  var selected = os.ui.im.action.FilterActionNode.toEntries(this['selected']);
  os.ui.im.action.launchFilterActionExport(entries, selected, this.getExportName());
};
goog.exportProperty(
    os.ui.im.action.FilterActionsCtrl.prototype,
    'launchExport',
    os.ui.im.action.FilterActionsCtrl.prototype.launchExport);


/**
 * Launch the import dialog.
 */
os.ui.im.action.FilterActionsCtrl.prototype.launchImport = function() {
  os.metrics.Metrics.getInstance().updateMetric(os.im.action.Metrics.IMPORT, 1);

  var event = new os.ui.im.ImportEvent(os.ui.im.ImportEventType.FILE, undefined, undefined, {
    'layerId': this.entryType
  });
  os.dispatcher.dispatchEvent(event);
};
goog.exportProperty(
    os.ui.im.action.FilterActionsCtrl.prototype,
    'launchImport',
    os.ui.im.action.FilterActionsCtrl.prototype.launchImport);
