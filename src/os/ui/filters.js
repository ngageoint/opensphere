goog.declareModuleId('os.ui.FiltersUI');

import './addfilter.js';
import './slick/slicktree.js';
import AlertEventSeverity from '../alert/alerteventseverity.js';
import AlertManager from '../alert/alertmanager.js';
import CommandProcessor from '../command/commandprocessor.js';
import SequenceCommand from '../command/sequencecommand.js';
import FilterNode from '../data/filternode.js';
import FilterTreeSearch from '../data/filtertreesearch.js';
import SourceGroupBy from '../data/groupby/sourcegroupby.js';
import LayerEventType from '../events/layereventtype.js';
import {createFromFile} from '../file/index.js';
import BaseFilterManager from '../filter/basefiltermanager.js';
import {getMapContainer} from '../map/mapinstance.js';
import Metrics from '../metrics/metrics.js';
import {Filters} from '../metrics/metricskeys.js';
import {ROOT} from '../os.js';
import {launchQueryImport} from '../query/query.js';
import {getFilterManager} from '../query/queryinstance.js';
import FilterEventType from './filter/filtereventtype.js';
import * as FilterExportUI from './filter/ui/filterexport.js';
import FilterExportChoice from './filter/ui/filterexportchoice.js';
import FilterLayerGroupBy from './filterlayergroupby.js';
import {MENU} from './menu/filtermenu.js';
import Module from './module.js';
import FilterAdd from './query/cmd/filteraddcmd.js';
import FilterRemove from './query/cmd/filterremovecmd.js';
import * as CombinatorUI from './query/combinator.js';
import AbstractGroupByTreeSearchCtrl from './slick/abstractgroupbytreesearchctrl.js';

const GoogEventType = goog.require('goog.events.EventType');

const GoogEvent = goog.requireType('goog.events.Event');
const {default: INodeGroupBy} = goog.requireType('os.data.groupby.INodeGroupBy');
const {default: PropertyChangeEvent} = goog.requireType('os.events.PropertyChangeEvent');
const {default: OSFile} = goog.requireType('os.file.File');
const {default: FilterEntry} = goog.requireType('os.filter.FilterEntry');
const {default: IFilterable} = goog.requireType('os.filter.IFilterable');
const {default: FilterEvent} = goog.requireType('os.ui.filter.FilterEvent');
const {default: SlickTreeNode} = goog.requireType('os.ui.slick.SlickTreeNode');


/**
 * The filters window directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/filters.html',
  controller: Controller,
  controllerAs: 'filtersCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'filters';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for Filters window
 * @unrestricted
 */
export class Controller extends AbstractGroupByTreeSearchCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element, 25);

    this.title = 'filters';
    try {
      this.scope['contextMenu'] = MENU;
    } catch (e) {
    }

    this.viewDefault = 'Layer Type';

    /**
     * Bound version of the drag-drop handler.
     * @type {Function}
     */
    this['onDrop'] = this.onDrop_.bind(this);

    /**
     * @type {?FilterTreeSearch}
     */
    this.treeSearch = new FilterTreeSearch('filters', this.scope);
    this.scope['views'] = Controller.VIEWS;
    this.init();

    $scope.$on('filterCopy', this.onCopyFilter_.bind(this));
    $scope.$on('filterEdit', this.onEditFilter_.bind(this));
    $scope.$on('filterComplete', this.onEditComplete_.bind(this));

    getFilterManager().listen(GoogEventType.PROPERTYCHANGE, this.searchIfAddedOrRemoved_, false, this);
    getFilterManager().listen(FilterEventType.FILTERS_REFRESH, this.search, false, this);
    getFilterManager().listen(FilterEventType.EXPORT_FILTER, this.export, false, this);

    var map = getMapContainer();
    map.listen(LayerEventType.ADD, this.search, false, this);
    map.listen(LayerEventType.REMOVE, this.search, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    getFilterManager().unlisten(FilterEventType.EXPORT_FILTER, this.export, false, this);
    getFilterManager().unlisten(FilterEventType.FILTERS_REFRESH, this.search, false, this);
    getFilterManager().unlisten(GoogEventType.PROPERTYCHANGE, this.searchIfAddedOrRemoved_, false, this);
    var map = getMapContainer();
    map.unlisten(LayerEventType.ADD, this.search, false, this);
    map.unlisten(LayerEventType.REMOVE, this.search, false, this);
    super.disposeInternal();
  }

  /**
   * Launches the advanced combination window
   *
   * @export
   */
  launch() {
    CombinatorUI.launch();
    Metrics.getInstance().updateMetric(Filters.ADVANCED, 1);
  }

  /**
   * Pop up filter export gui
   *
   * @param {FilterEvent=} opt_event right click export event
   * @export
   */
  export(opt_event) {
    FilterExportUI.launchFilterExport(this.save_.bind(this));
  }

  /**
   * Disables export button
   *
   * @return {boolean}
   * @export
   */
  exportDisabled() {
    // off when no filters present
    var filters = getFilterManager().getFilters();
    if (filters && filters.length > 0) {
      return false;
    }

    return true;
  }

  /**
   * Save the filters to a file
   *
   * @param {string} name of the file
   * @param {FilterExportChoice} mode how to export filters
   * @private
   */
  save_(name, mode) {
    var filters = [];
    if (mode != FilterExportChoice.SELECTED) {
      this.flatten_(this.scope['filters'], filters,
          mode == FilterExportChoice.ACTIVE);
    } else if (this.scope['selected'] && this.scope['selected'].length) {
      filters = this.scope['selected'];
    } else if (this.scope['selected']) {
      filters = [this.scope['selected']];
    }

    // remove nodes that are not filters (e.g. the layer node in Group Type -> Layer Type)
    filters = filters.filter(function(f) {
      return f instanceof FilterNode;
    });

    FilterExportUI.exportFilters(name, filters);
  }

  /**
   * Get filters out of the tree
   *
   * @param {Array} arr The array of items
   * @param {Array} result The resulting flat array
   * @param {boolean} activeOnly get only the active filters
   * @private
   */
  flatten_(arr, result, activeOnly) {
    if (arr) {
      for (var i = 0, n = arr.length; i < n; i++) {
        var item = /** @type {SlickTreeNode} */ (arr[i]);
        if (item.getChildren()) {
          // parent node
          this.flatten_(item.getChildren(), result, activeOnly);
        } else if ((activeOnly && item.getState() == 'on' || !activeOnly) && item.getEntry()) {
          var filterId = item.getId();
          if (filterId !== undefined && filterId != '*') {
            result.push(item);
          }
        }
      }
    }
  }

  /**
   * Launches the filter import window.
   *
   * @param {OSFile=} opt_file Optional file to use in the import.
   * @export
   */
  import(opt_file) {
    launchQueryImport(undefined, opt_file);
  }

  /**
   * Handles adds/edits to filters
   *
   * @param {angular.Scope.Event} event
   * @param {FilterEntry} entry
   * @private
   */
  onEditFilter_(event, entry) {
    var filterable = /** @type {IFilterable} */ (getFilterManager().getFilterable(entry.getType()));
    var cols = null;
    try {
      if (filterable) {
        cols = filterable.getFilterColumns();
      }
    } catch (e) {
      // most likely, layer wasn't an IFilterable implementation
    }
    if (cols) {
      BaseFilterManager.edit(entry.getType(), cols, this.editEntry.bind(this), entry);
    } else {
      AlertManager.getInstance().sendAlert('This layer is missing required information to edit filters.',
          AlertEventSeverity.WARNING);
    }
  }

  /**
   * Handles adds/edits to filters
   *
   * @param {angular.Scope.Event} event
   * @param {FilterEntry} entry
   * @private
   */
  onEditComplete_(event, entry) {
    event.stopPropagation();

    this.editEntry(entry);
  }

  /**
   * Handles adds/edits to filters
   *
   * @param {FilterEntry} entry
   * @protected
   */
  editEntry(entry) {
    if (entry) {
      var fqm = getFilterManager();
      var original = fqm.getFilter(entry.getId());

      if (original) {
        // edit
        var rm = new FilterRemove(original);
        var add = new FilterAdd(entry);
        var edit = new SequenceCommand();
        edit.setCommands([rm, add]);
        edit.title = 'Edit Filter ' + entry.getTitle();
        CommandProcessor.getInstance().addCommand(edit);
      } else {
        // add
        CommandProcessor.getInstance().addCommand(new FilterAdd(entry));
      }
    }
  }

  /**
   * Handles adds/edits to filters
   *
   * @param {angular.Scope.Event} event
   * @param {FilterEntry} entry
   * @private
   */
  onCopyFilter_(event, entry) {
    BaseFilterManager.copy(entry, entry.getType());
  }

  /**
   * Preform a search only if a node is added, updated, or removed
   *
   * @param {PropertyChangeEvent} event The event
   * @private
   */
  searchIfAddedOrRemoved_(event) {
    if (event && event.getProperty() !== 'toggle') {
      this.search();
    }
  }

  /**
   * Handles Group By change
   *
   * @export
   */
  onGroupChange() {
    this.search();
    Metrics.getInstance().updateMetric(Filters.GROUP_BY, 1);
  }

  /**
   * Handles Group By change
   *
   * @export
   */
  onSearchTermChange() {
    this.search();
    Metrics.getInstance().updateMetric(Filters.SEARCH, 1);
  }

  /**
   * Handles file drops over the filters tab.
   *
   * @param {Event} event The drop event.
   */
  onDrop_(event) {
    if (event.dataTransfer && event.dataTransfer.files) {
      createFromFile(/** @type {!File} */ (event.dataTransfer.files[0]))
          .addCallback(this.import.bind(this), this.onFail_.bind(this));
    }
  }

  /**
   * Handle file drag-drop.
   *
   * @param {!GoogEvent|OSFile} event
   * @private
   */
  onFail_(event) {
    AlertManager.getInstance().sendAlert(
        'Could not handle file with drag and drop. Try again or use the browse capability.');
  }
}

/**
 * The view options for grouping filters
 * @type {!Object<string, INodeGroupBy>}
 */
Controller.VIEWS = {
  'None': -1, // you can't use null because Angular treats that as the empty/unselected option
  'Layer': new FilterLayerGroupBy(),
  'Layer Type': new FilterLayerGroupBy(true),
  'Source': new SourceGroupBy(true)
};
