goog.declareModuleId('os.ui.im.action.FilterActionsCtrl');

import CommandProcessor from '../../../command/commandprocessor.js';
import * as dispatcher from '../../../dispatcher.js';
import {Metrics as ActionMetrics} from '../../../im/action/importaction.js';
import ImportActionEventType from '../../../im/action/importactioneventtype.js';
import ImportActionManager from '../../../im/action/importactionmanager.js';
import Metrics from '../../../metrics/metrics.js';
import TagGroupBy from '../../data/groupby/taggroupby.js';
import AbstractGroupByTreeSearchCtrl from '../../slick/abstractgroupbytreesearchctrl.js';
import SlickGridEvent from '../../slick/slickgridevent.js';
import * as osWindow from '../../window.js';
import ImportEvent from '../importevent.js';
import ImportEventType from '../importeventtype.js';
import * as filter from './filteraction.js';
import {launchFilterActionExport} from './filteractionexport.js';
import FilterActionNode from './filteractionnode.js';
import FilterActionTreeSearch from './filteractiontreesearch.js';

const googArray = goog.require('goog.array');

const {default: FilterActionEntry} = goog.requireType('os.im.action.FilterActionEntry');


/**
 * Base controller for viewing/editing filter action entries.
 *
 * @abstract
 * @template T
 * @unrestricted
 */
export default class Controller extends AbstractGroupByTreeSearchCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element, 200);
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
     * @type {Array<FilterActionNode>|FilterActionNode}
     */
    this['selected'] = null;

    /**
     * Action entries to view/edit.
     * @type {!Array<!FilterActionNode>}
     */
    this.scope['entries'] = [];

    /**
     * @type {?FilterActionTreeSearch}
     */
    this.treeSearch = new FilterActionTreeSearch('entries', this.scope, this.entryType);
    this.scope['views'] = Controller.VIEWS;

    var iam = ImportActionManager.getInstance();
    iam.listen(ImportActionEventType.REFRESH, this.search, false, this);

    $scope.$on(ImportActionEventType.COPY_ENTRY, this.onCopyEvent.bind(this));
    $scope.$on(ImportActionEventType.EDIT_ENTRY, this.onEditEvent.bind(this));
    $scope.$on(ImportActionEventType.REMOVE_ENTRY, this.onRemoveEvent.bind(this));

    $scope.$on(SlickGridEvent.ORDER_CHANGE, this.onOrderChange.bind(this));
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    var iam = ImportActionManager.getInstance();
    iam.unlisten(ImportActionEventType.REFRESH, this.search, false, this);

    this.scope = null;
    this.element = null;
  }

  /**
   * Angular $onInit lifecycle function.
   */
  $onInit() {
    this.init();
  }

  /**
   * Apply changes.
   *
   * @export
   */
  apply() {
    ImportActionManager.getInstance().apply();
  }

  /**
   * Close the window, discarding any pending changes.
   *
   * @export
   */
  close() {
    osWindow.close(this.element);
  }

  /**
   * Save the filter action entries to the manager.
   *
   * @protected
   */
  saveEntries() {
    if (this.scope['entries']) {
      // convert tree nodes back to entries and save
      var entryNodes = [];

      this.scope['entries'].forEach(filter.isFilterActionNode.bind(this, entryNodes));
      var entries = FilterActionNode.toEntries(entryNodes);

      // the tag group by sometimes creates multiple nodes for the same entry, so remove duplicate entries here
      googArray.removeDuplicates(entries);

      ImportActionManager.getInstance().setActionEntries(this.entryType, entries);
    }
  }

  /**
   * Get the list of filter columns.
   *
   * @return {!Array} The columns.
   * @protected
   */
  getColumns() {
    return filter.getColumns(this.entryType);
  }

  /**
   * Get the initial file name to use for export.
   *
   * @return {string} The file name.
   * @protected
   */
  getExportName() {
    return filter.getExportName();
  }

  /**
   * Edit an action entry. If no entry is provided, a new one will be created.
   *
   * @param {FilterActionEntry<T>=} opt_entry The import action entry.
   * @abstract
   * @export
   */
  editEntry(opt_entry) {}

  /**
   * Handle node event to copy an entry.
   *
   * @param {angular.Scope.Event} event The Angular event.
   * @param {FilterActionEntry<T>} entry The import action entry.
   * @param {number} parentIndex The parent index.
   */
  onCopyEvent(event, entry, parentIndex) {
    event.stopPropagation();

    if (entry) {
      var cmd = filter.copyEntryCmd(entry, parentIndex == -1 ? undefined : parentIndex + 1);
      CommandProcessor.getInstance().addCommand(cmd);
    }
  }

  /**
   * Handle node event to edit an entry.
   *
   * @param {angular.Scope.Event} event The Angular event.
   * @param {FilterActionEntry<T>} entry The import action entry.
   */
  onEditEvent(event, entry) {
    event.stopPropagation();

    if (entry) {
      this.editEntry(entry);
    }
  }

  /**
   * Handle tree order change event.
   *
   * @param {angular.Scope.Event} event The Angular event.
   * @protected
   */
  onOrderChange(event) {
    event.stopPropagation();
    this.saveEntries();
  }

  /**
   * Handle node event to remove an entry.
   *
   * @param {angular.Scope.Event} event The Angular event.
   * @param {FilterActionEntry<T>} entry The import action entry.
   */
  onRemoveEvent(event, entry) {
    event.stopPropagation();

    if (entry) {
      var cmd = filter.removeEntryCmd(entry);
      CommandProcessor.getInstance().addCommand(cmd);
    }
  }

  /**
   * If there is at least one selected entry.
   *
   * @return {boolean} If one or more selected entries are available.
   * @export
   */
  hasSelected() {
    return this['selected'] && this['selected'].length > 0;
  }

  /**
   * Launch the export dialog.
   *
   * @export
   */
  launchExport() {
    Metrics.getInstance().updateMetric(ActionMetrics.EXPORT, 1);

    // pull the entry nodes out of the tree
    var entryNodes = [];
    var selectedEntryNodes = [];

    this.scope['entries'].forEach(filter.isFilterActionNode.bind(this, entryNodes));
    this['selected'].forEach(filter.isFilterActionNode.bind(this, selectedEntryNodes));

    var entries = FilterActionNode.toEntries(entryNodes);
    var selected = FilterActionNode.toEntries(selectedEntryNodes);
    launchFilterActionExport(entries, selected, this.getExportName());
  }

  /**
   * Launch the import dialog.
   *
   * @export
   */
  launchImport() {
    Metrics.getInstance().updateMetric(ActionMetrics.IMPORT, 1);

    var event = new ImportEvent(ImportEventType.FILE, undefined, undefined, {
      'layerId': this.entryType
    });
    dispatcher.getInstance().dispatchEvent(event);
  }
}


/**
 * The view options for grouping filters
 * @type {!Object<string, os.data.groupby.INodeGroupBy>}
 */
Controller.VIEWS = {
  'None': -1, // you can't use null because Angular treats that as the empty/unselected option
  'Tags': new TagGroupBy()
};
